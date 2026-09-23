import { isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Exercise } from "../domain/Exercise";
import type { ExerciseFilter, ExerciseRepository, RepositoryError } from "./ports";

/**
 * `FilterExercises` (CA-02.02.1, tarea `F02-T11`). Expone `count` para el
 * anuncio al lector de pantalla que hace la pantalla `Filters.tsx`.
 */
export interface FilterExercisesResult {
  items: Exercise[];
  count: number;
}

export class FilterExercises {
  constructor(private readonly exercises: ExerciseRepository) {}

  async execute(criteria: ExerciseFilter): Promise<Result<FilterExercisesResult, RepositoryError>> {
    const result = await this.exercises.filter(criteria);
    if (!isOk(result)) {
      return result;
    }
    return ok({ items: result.value, count: result.value.length });
  }
}
