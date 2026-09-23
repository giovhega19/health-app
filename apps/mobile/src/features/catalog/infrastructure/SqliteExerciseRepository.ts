import { eq } from "drizzle-orm";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { Equipment } from "@/shared/domain/Equipment";
import type { ExerciseDifficulty } from "@/shared/domain/ExerciseDifficulty";
import type { ExerciseMode } from "@/shared/domain/ExerciseMode";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { exercises } from "@/shared/infrastructure/db/schema";
import { Exercise } from "../domain/Exercise";
import type { ExerciseFilter, ExerciseRepository, RepositoryError } from "../application/ports";

/**
 * `SqliteExerciseRepository` (RF-02.01, tarea `F02-T08`): implementa
 * `ExerciseRepository` sobre Drizzle/SQLite (`schema.ts`, tabla `exercises`).
 * El filtrado (CA-02.02.1) se hace en memoria tras leer todo el catálogo
 * local (≤ unos pocos cientos de filas en el MVP, `spec.md` "~60
 * ejercicios"): mantiene la lógica de coincidencia en un solo lugar en vez
 * de duplicarla en SQL y en `FilterExercises`/pruebas.
 */
export class SqliteExerciseRepository implements ExerciseRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async findById(id: Id): Promise<Result<Exercise | null, RepositoryError>> {
    try {
      const rows = await this.db.select().from(exercises).where(eq(exercises.id, id));
      const row = rows[0];
      return ok(row ? mapRowToExercise(row) : null);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async filter(criteria: ExerciseFilter): Promise<Result<Exercise[], RepositoryError>> {
    try {
      const rows = await this.db.select().from(exercises);
      const items = rows
        .map(mapRowToExercise)
        .filter((exercise) => {
          const matchesMuscleGroup =
            !criteria.muscleGroup || exercise.muscleGroups.includes(criteria.muscleGroup);
          const matchesEquipment = !criteria.equipment || exercise.equipment.includes(criteria.equipment);
          return matchesMuscleGroup && matchesEquipment;
        });
      return ok(items);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async upsertMany(exercisesToUpsert: Exercise[]): Promise<Result<void, RepositoryError>> {
    try {
      const nowIso = this.clock.now().toISOString();
      for (const exercise of exercisesToUpsert) {
        const row = {
          id: exercise.id,
          slug: exercise.slug,
          name: exercise.name,
          muscleGroups: exercise.muscleGroups,
          equipment: exercise.equipment,
          difficulty: exercise.difficulty,
          mode: exercise.mode,
          met: exercise.met,
          instructions: exercise.instructions,
          commonMistakes: exercise.commonMistakes,
          imageUrl: exercise.imageUrl,
          animationUrl: exercise.animationUrl,
          videoUrl: exercise.videoUrl,
          isCustom: exercise.isCustom,
          updatedAt: nowIso,
          deletedAt: null,
        };
        await this.db.insert(exercises).values(row).onConflictDoUpdate({ target: exercises.id, set: row });
      }
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }
}

interface ExerciseRow {
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
}

function mapRowToExercise(row: ExerciseRow): Exercise {
  return Exercise.create({
    id: asId(row.id),
    slug: row.slug,
    name: row.name,
    muscleGroups: row.muscleGroups as MuscleGroup[],
    equipment: row.equipment as Equipment[],
    difficulty: row.difficulty as ExerciseDifficulty,
    mode: row.mode as ExerciseMode,
    met: row.met,
    instructions: row.instructions,
    commonMistakes: row.commonMistakes,
    imageUrl: row.imageUrl,
    animationUrl: row.animationUrl,
    videoUrl: row.videoUrl,
    isCustom: row.isCustom,
  });
}

function toRepositoryError(error: unknown): RepositoryError {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "STORAGE_ERROR", message };
}
