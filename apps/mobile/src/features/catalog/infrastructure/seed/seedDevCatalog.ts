import { asId } from "@/shared/domain/Id";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { Equipment } from "@/shared/domain/Equipment";
import type { ExerciseDifficulty } from "@/shared/domain/ExerciseDifficulty";
import type { ExerciseMode } from "@/shared/domain/ExerciseMode";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock, RoutineBlockType, RoutineGrouping } from "@/shared/domain/RoutineBlock";
import { Exercise } from "../../domain/Exercise";
import { PredefinedRoutine } from "../../domain/PredefinedRoutine";
import type { ExerciseRepository, PredefinedRoutineRepository } from "../../application/ports";
import rawCatalog from "./dev-catalog.json";

/**
 * `seedDevCatalog` (RF-02.05, tarea `F02-T09`): catálogo semilla de
 * desarrollo envasado en el cliente (`dev-catalog.json`), materializado en
 * el arranque si las tablas locales están vacías (`specs/F02-catalogo-propuesta/plan.md`
 * §1 "Contenido de datos"). Usa la MISMA lista que `test/fakes/aCatalogSnapshot.ts`
 * (mismos `slug`/id) para evitar el drift documentado en `plan.md` §6; no
 * importa ese fixture de pruebas desde código de producción (arquitectura no
 * permite que `src/` dependa de `test/`), así que el contenido se mantiene
 * sincronizado a mano entre ambos archivos.
 *
 * NO es el contenido real del catálogo (~60 ejercicios validados por un
 * profesional del deporte, fuera de alcance técnico, ver `spec.md`).
 */
interface RawExercise {
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
  animationUrl: string | null;
  videoUrl: string | null;
  isCustom: boolean;
  updatedAt: string;
}

interface RawRoutineItem {
  id: string;
  exerciseId: string;
  sets: number;
  targetReps?: number;
  targetSeconds?: number;
}

interface RawRoutineBlock {
  id: string;
  type: string;
  grouping: string;
  rounds: number;
  items: RawRoutineItem[];
}

interface RawRoutine {
  id: string;
  name: string;
  goal: string;
  level: string;
  timerDefaults: TimerSettings;
  version: number;
  updatedAt: string;
  blocks: RawRoutineBlock[];
}

interface RawCatalog {
  exercises: RawExercise[];
  routines: RawRoutine[];
}

const catalog = rawCatalog as RawCatalog;

function mapExercise(raw: RawExercise): Exercise {
  return Exercise.create({
    id: asId(raw.id),
    slug: raw.slug,
    name: raw.name,
    muscleGroups: raw.muscleGroups as MuscleGroup[],
    equipment: raw.equipment as Equipment[],
    difficulty: raw.difficulty as ExerciseDifficulty,
    mode: raw.mode as ExerciseMode,
    met: raw.met,
    instructions: raw.instructions,
    commonMistakes: raw.commonMistakes,
    imageUrl: raw.imageUrl,
    animationUrl: raw.animationUrl,
    videoUrl: raw.videoUrl,
    isCustom: raw.isCustom,
  });
}

function mapRoutine(raw: RawRoutine): PredefinedRoutine {
  const blocks: RoutineBlock[] = raw.blocks.map((block) => ({
    id: asId(block.id),
    type: block.type as RoutineBlockType,
    grouping: block.grouping as RoutineGrouping,
    rounds: block.rounds,
    items: block.items.map((item) => ({
      id: asId(item.id),
      exerciseId: asId(item.exerciseId),
      sets: item.sets,
      targetReps: item.targetReps,
      targetSeconds: item.targetSeconds,
    })),
  }));

  return PredefinedRoutine.create({
    id: asId(raw.id),
    name: raw.name,
    goal: raw.goal as FitnessGoal,
    level: raw.level as Level,
    timerDefaults: raw.timerDefaults,
    blocks,
    version: raw.version,
    updatedAt: new Date(raw.updatedAt),
  });
}

/**
 * Siembra el catálogo local solo si las tablas están vacías (idempotente):
 * seguro de llamar en cada arranque de la app sin duplicar filas.
 */
export async function seedDevCatalogIfEmpty(
  exerciseRepository: ExerciseRepository,
  routineRepository: PredefinedRoutineRepository,
): Promise<void> {
  const existing = await exerciseRepository.filter({});
  if (existing.ok && existing.value.length > 0) {
    return;
  }

  await exerciseRepository.upsertMany(catalog.exercises.map(mapExercise));
  await routineRepository.upsertMany(catalog.routines.map(mapRoutine));
}
