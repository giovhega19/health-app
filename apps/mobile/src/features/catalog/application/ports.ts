import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { Equipment } from "@/shared/domain/Equipment";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { Exercise } from "../domain/Exercise";
import type { PredefinedRoutine } from "../domain/PredefinedRoutine";

/**
 * Puertos de `catalog/application` (`specs/F02-catalogo-propuesta/plan.md` §3).
 */
export interface RepositoryError {
  kind: "NOT_FOUND" | "STORAGE_ERROR" | "UNKNOWN";
  message?: string;
}

export interface ExerciseFilter {
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
}

export interface ExerciseRepository {
  findById(id: Id): Promise<Result<Exercise | null, RepositoryError>>;
  filter(criteria: ExerciseFilter): Promise<Result<Exercise[], RepositoryError>>;
  upsertMany(exercises: Exercise[]): Promise<Result<void, RepositoryError>>;
}

export interface PredefinedRoutineRepository {
  all(): Promise<Result<PredefinedRoutine[], RepositoryError>>;
  upsertMany(routines: PredefinedRoutine[]): Promise<Result<void, RepositoryError>>;
}

export type LocalUri = string;

export type MediaKind = "IMAGE" | "ANIMATION" | "VIDEO";

export interface MediaRef {
  remoteUrl: string;
  /**
   * Campos opcionales añadidos por ADR-008 ("Caché de medios con política
   * LRU"), compatibles con la forma ya fijada por `EnsureOfflineMedia.test.ts`/
   * `FakeMediaCachePort.ts` (solo `remoteUrl`, obligatorio). Si se omiten,
   * `MediaCacheAdapter` infiere `kind` de la extensión de la URL y trata la
   * entrada como no evictable por defecto (ADR-008 "Puerto de dominio").
   */
  kind?: MediaKind;
  resourceUpdatedAt?: Date;
}

export type MediaCacheError =
  | { kind: "NETWORK_UNAVAILABLE" }
  | { kind: "NOT_FOUND" }
  | { kind: "STORAGE_FULL" };

export interface MediaCachePort {
  ensureCached(mediaRef: MediaRef): Promise<Result<LocalUri, MediaCacheError>>;
  evictLeastRecentlyUsed(bytesNeeded: number): Promise<void>;
}

export interface CatalogManifest {
  version: number;
  exercisesEtag: string;
  routinesEtag: string;
  mediaBaseUrl: string;
  updatedAt: Date;
}

export type HttpError =
  | { kind: "NETWORK_ERROR"; message?: string }
  | { kind: "SERVER_ERROR"; status?: number; message?: string };

export interface CatalogManifestPort {
  fetchManifest(): Promise<Result<CatalogManifest, HttpError>>;
  fetchUpdatedSince(kind: "exercises" | "routines", since: Date | null): Promise<Result<unknown[], HttpError>>;
}

/**
 * `ProfileSnapshot` (`specs/F02-catalogo-propuesta/plan.md` §1): DTO de solo
 * lectura que F01 pasa a `generateProposal` sin que `catalog` importe nada
 * de `features/profile`.
 */
export interface ProfileSnapshot {
  profileId: Id;
  goal: FitnessGoal;
  level: Level;
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: Equipment[];
  parqFlagged: boolean;
}
