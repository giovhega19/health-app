import { isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { Equipment } from "@/shared/domain/Equipment";
import type { ExerciseDifficulty } from "@/shared/domain/ExerciseDifficulty";
import type { ExerciseMode } from "@/shared/domain/ExerciseMode";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock } from "@/shared/domain/RoutineBlock";
import { Exercise } from "../domain/Exercise";
import { PredefinedRoutine } from "../domain/PredefinedRoutine";
import type { CatalogManifestPort, ExerciseRepository, HttpError, PredefinedRoutineRepository } from "./ports";

/**
 * `DownloadCatalogUpdate` (CA-02.06.1, tarea `F02-T14`). Compara el manifest
 * remoto con la versión local; si hay una versión mayor, descarga solo los
 * cambios (`updatedSince`) y hace `UPSERT` en `exercises`/`predefined_routines`
 * (nunca en tablas de "Mis rutinas", que no existen hasta F03/H2).
 */
export interface DownloadCatalogUpdateInput {
  localVersion: number;
  lastSyncedAt: Date;
}

interface RawExerciseDto {
  id: string;
  slug: string;
  name: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: number;
  mode: string;
  met: number;
  instructions: string[];
  commonMistakes: string[];
  imageUrl: string;
  animationUrl?: string | null;
  videoUrl?: string | null;
  isCustom?: boolean;
}

interface RawRoutineDto {
  id: string;
  name: string;
  goal: string;
  level: string;
  timerDefaults: TimerSettings;
  blocks: RoutineBlock[];
  version: number;
  updatedAt: string;
}

function mapExerciseDto(raw: unknown): Exercise {
  const dto = raw as RawExerciseDto;
  return Exercise.create({
    id: asId(dto.id),
    slug: dto.slug,
    name: dto.name,
    muscleGroups: dto.muscleGroups as MuscleGroup[],
    equipment: dto.equipment as Equipment[],
    difficulty: dto.difficulty as ExerciseDifficulty,
    mode: dto.mode as ExerciseMode,
    met: dto.met,
    instructions: dto.instructions,
    commonMistakes: dto.commonMistakes,
    imageUrl: dto.imageUrl,
    animationUrl: dto.animationUrl ?? null,
    videoUrl: dto.videoUrl ?? null,
    isCustom: dto.isCustom ?? false,
  });
}

function mapRoutineDto(raw: unknown): PredefinedRoutine {
  const dto = raw as RawRoutineDto;
  return PredefinedRoutine.create({
    id: asId(dto.id),
    name: dto.name,
    goal: dto.goal as FitnessGoal,
    level: dto.level as Level,
    timerDefaults: dto.timerDefaults,
    blocks: dto.blocks,
    version: dto.version,
    updatedAt: new Date(dto.updatedAt),
  });
}

export class DownloadCatalogUpdate {
  constructor(
    private readonly manifestPort: CatalogManifestPort,
    private readonly exerciseRepository: ExerciseRepository,
    private readonly routineRepository: PredefinedRoutineRepository,
  ) {}

  async execute(input: DownloadCatalogUpdateInput): Promise<Result<void, HttpError>> {
    const manifestResult = await this.manifestPort.fetchManifest();
    if (!isOk(manifestResult)) {
      return manifestResult;
    }

    if (manifestResult.value.version <= input.localVersion) {
      return ok(undefined);
    }

    const exercisesResult = await this.manifestPort.fetchUpdatedSince("exercises", input.lastSyncedAt);
    if (!isOk(exercisesResult)) {
      return exercisesResult;
    }

    const routinesResult = await this.manifestPort.fetchUpdatedSince("routines", input.lastSyncedAt);
    if (!isOk(routinesResult)) {
      return routinesResult;
    }

    const exercises = exercisesResult.value.map(mapExerciseDto);
    const routines = routinesResult.value.map(mapRoutineDto);

    await this.exerciseRepository.upsertMany(exercises);
    await this.routineRepository.upsertMany(routines);

    return ok(undefined);
  }
}
