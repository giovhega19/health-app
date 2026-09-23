import { err, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { Exercise } from "../domain/Exercise";
import type { ExerciseNotFoundError } from "../domain/errors";
import type { ExerciseRepository, RepositoryError } from "./ports";

/**
 * `GetExerciseDetail` (CA-02.01.1, tarea `F02-T11`).
 */
export class GetExerciseDetail {
  constructor(private readonly exercises: ExerciseRepository) {}

  async execute(id: Id): Promise<Result<Exercise, ExerciseNotFoundError | RepositoryError>> {
    const result = await this.exercises.findById(id);
    if (!isOk(result)) {
      return result;
    }
    if (!result.value) {
      return err({ kind: "NOT_FOUND" });
    }
    return ok(result.value);
  }
}
