import { isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock } from "@/shared/domain/RoutineBlock";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { ExerciseMode } from "@/shared/domain/ExerciseMode";
import type { RemoteChange, RepositoryError as SyncRepositoryError, SyncEntityApplier } from "@/features/sync";
import { Routine } from "../domain/Routine";
import type { RoutineSource } from "../domain/Routine";
import { CustomExercise } from "../domain/CustomExercise";
import type { CustomExerciseRepository, RoutineRepository } from "../application/ports";

/**
 * `RoutineSyncEntityApplier` (tarea `F03-T15`): implementación del SPI
 * `SyncEntityApplier` (`features/sync`) para `entity ∈ {routine,
 * customExercise}` — mismo patrón exacto que `ProfileSyncEntityApplier`
 * (F01, `features/profile/infrastructure/ProfileSyncEntityApplier.ts`).
 * Aplica un `RemoteChange` recibido por `GET /sync/pull` al almacenamiento
 * local (LWW por `updatedAt`, ADR-007: `save()` es upsert).
 */
export class RoutineSyncEntityApplier implements SyncEntityApplier {
  constructor(
    private readonly routineRepository: RoutineRepository,
    private readonly customExerciseRepository: CustomExerciseRepository,
  ) {}

  supports(entity: string): boolean {
    return entity === "routine" || entity === "customExercise";
  }

  async apply(change: RemoteChange): Promise<Result<void, SyncRepositoryError>> {
    if (change.op === "delete") {
      if (change.entity === "routine") {
        return this.routineRepository.softDelete(asId(change.id));
      }
      // `customExercise` no tiene borrado remoto propio en H2 (ningún CA lo
      // exige); se ignora de forma segura, igual que `profile` en H1.
      return ok(undefined);
    }
    if (!change.data) {
      return ok(undefined);
    }

    if (change.entity === "routine") {
      return this.applyRoutine(change.data);
    }
    return this.applyCustomExercise(change.data);
  }

  private async applyRoutine(data: Record<string, unknown>): Promise<Result<void, SyncRepositoryError>> {
    const created = Routine.create({
      id: asId(data.id as string),
      name: data.name as string,
      description: (data.description as string | null) ?? null,
      goal: data.goal as FitnessGoal,
      level: data.level as Level,
      source: data.source as RoutineSource,
      timerDefaults: data.timerDefaults as TimerSettings,
      blocks: data.blocks as RoutineBlock[],
      version: (data.version as number) ?? 1,
      updatedAt: new Date(data.updatedAt as string),
      deletedAt: data.deletedAt ? new Date(data.deletedAt as string) : null,
    });
    if (!isOk(created)) {
      return { ok: false, error: { kind: "UNKNOWN", message: "RemoteChange de routine inválido" } };
    }
    const saveResult = await this.routineRepository.save(created.value);
    return isOk(saveResult) ? ok(undefined) : saveResult;
  }

  private async applyCustomExercise(data: Record<string, unknown>): Promise<Result<void, SyncRepositoryError>> {
    const created = CustomExercise.create({
      id: asId(data.id as string),
      name: data.name as string,
      notes: (data.notes as string | null) ?? null,
      photoUri: (data.photoUri as string | null) ?? null,
      muscleGroups: data.muscleGroups as MuscleGroup[],
      mode: data.mode as ExerciseMode,
    });
    if (!isOk(created)) {
      return { ok: false, error: { kind: "UNKNOWN", message: "RemoteChange de customExercise inválido" } };
    }
    const saveResult = await this.customExerciseRepository.save(created.value);
    return isOk(saveResult) ? ok(undefined) : saveResult;
  }
}
