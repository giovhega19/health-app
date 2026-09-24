import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { ExerciseMode } from "@/shared/domain/ExerciseMode";
import type { Routine } from "../domain/Routine";
import type { CustomExercise } from "../domain/CustomExercise";
import type { FileError, LookupError, RepositoryError } from "../domain/errors";

/**
 * Puertos de `routines/application` (`specs/F03-editor-rutinas/plan.md` §3).
 */
export interface RoutineRepository {
  save(routine: Routine): Promise<Result<void, RepositoryError>>;
  findById(id: Id): Promise<Result<Routine | null, RepositoryError>>;
  listActive(): Promise<Result<Routine[], RepositoryError>>;
  softDelete(id: Id): Promise<Result<void, RepositoryError>>;
  /**
   * Borra todas las rutinas del dispositivo (CA-01.08.1/Art. 5.4, hallazgo
   * de seguridad H2 "Eliminar cuenta no purga datos locales de rutinas").
   * Mismo contrato que `ProfileRepository.clear()` (`profile/application/ports.ts`).
   */
  clear(): Promise<Result<void, RepositoryError>>;
}

export interface CustomExerciseRepository {
  save(exercise: CustomExercise): Promise<Result<void, RepositoryError>>;
  findById(id: Id): Promise<Result<CustomExercise | null, RepositoryError>>;
  /** Mismo contrato que `RoutineRepository.clear()`, ver comentario ahí (hallazgo H2). */
  clear(): Promise<Result<void, RepositoryError>>;
}

export interface PickedFile {
  content: string;
  sizeBytes: number;
}

export interface FileGateway {
  /** `null` = el usuario canceló la selección. */
  pickFile(): Promise<Result<PickedFile | null, FileError>>;
  shareFile(filename: string, content: string): Promise<Result<void, FileError>>;
}

export interface ExerciseDisplaySummary {
  id: Id;
  name: string;
  muscleGroups: MuscleGroup[];
  mode: ExerciseMode;
}

export interface ExerciseRef {
  source: "CATALOG" | "CUSTOM";
  id: Id;
}

export interface ExerciseDisplayLookupPort {
  resolve(ref: ExerciseRef): Promise<Result<ExerciseDisplaySummary, LookupError>>;
}

/**
 * Snapshot de solo lectura de una rutina predefinida (`catalog`), usado por
 * `DuplicateRoutine` (CA-03.05.1) sin importar `features/catalog` (Art. 2.5).
 */
export interface PredefinedRoutineSnapshot {
  id: Id;
  name: string;
  goal: Routine["goal"];
  level: Routine["level"];
  timerDefaults: Routine["timerDefaults"];
  blocks: Routine["blocks"];
}
