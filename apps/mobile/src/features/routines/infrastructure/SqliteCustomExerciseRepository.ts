import { eq } from "drizzle-orm";
import { err, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { ExerciseMode } from "@/shared/domain/ExerciseMode";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { customExercises } from "@/shared/infrastructure/db/schema";
import { CustomExercise } from "../domain/CustomExercise";
import type { RepositoryError } from "../domain/errors";
import type { CustomExerciseRepository } from "../application/ports";

/** `SqliteCustomExerciseRepository` (RF-03.07, tarea `F03-T07`). */
export class SqliteCustomExerciseRepository implements CustomExerciseRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async save(exercise: CustomExercise): Promise<Result<void, RepositoryError>> {
    try {
      const row = {
        id: exercise.id,
        name: exercise.name,
        notes: exercise.notes,
        photoUri: exercise.photoUri,
        muscleGroups: exercise.muscleGroups,
        mode: exercise.mode,
        updatedAt: this.clock.now().toISOString(),
        deletedAt: null,
      };
      await this.db.insert(customExercises).values(row).onConflictDoUpdate({ target: customExercises.id, set: row });
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async findById(id: Id): Promise<Result<CustomExercise | null, RepositoryError>> {
    try {
      const rows = await this.db.select().from(customExercises).where(eq(customExercises.id, id));
      const row = rows[0];
      if (!row || row.deletedAt) {
        return ok(null);
      }
      const created = CustomExercise.create({
        id: asId(row.id),
        name: row.name,
        notes: row.notes,
        photoUri: row.photoUri,
        muscleGroups: row.muscleGroups as MuscleGroup[],
        mode: row.mode as ExerciseMode,
      });
      return ok(isOk(created) ? created.value : null);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  /**
   * Borrado físico completo (hallazgo H2): incluye ejercicios personalizados
   * con `photoUri` (cachés locales de imagen quedan huérfanas del registro,
   * pero eso es un archivo, no un dato personal indexable — fuera de alcance
   * de este hallazgo).
   */
  async clear(): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(customExercises);
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }
}

function toRepositoryError(error: unknown): RepositoryError {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "STORAGE_ERROR", message };
}
