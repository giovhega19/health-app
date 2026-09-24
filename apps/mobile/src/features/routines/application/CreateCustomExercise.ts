import { isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { generateId } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { ExerciseMode } from "@/shared/domain/ExerciseMode";
import { CustomExercise } from "../domain/CustomExercise";
import type { CustomExerciseValidationError, RepositoryError } from "../domain/errors";
import type { CustomExerciseRepository } from "./ports";

/** `CreateCustomExercise` (RF-03.07, tarea `F03-T10`). */
export interface CreateCustomExerciseInput {
  name: string;
  notes?: string | null;
  photoUri?: string | null;
  muscleGroups: MuscleGroup[];
  mode: ExerciseMode;
}

export class CreateCustomExercise {
  constructor(
    private readonly repository: CustomExerciseRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: CreateCustomExerciseInput,
  ): Promise<Result<CustomExercise, CustomExerciseValidationError | RepositoryError>> {
    const created = CustomExercise.create({
      id: generateId(this.clock),
      name: input.name,
      notes: input.notes ?? null,
      photoUri: input.photoUri ?? null,
      muscleGroups: input.muscleGroups,
      mode: input.mode,
    });
    if (isErr(created)) {
      return created;
    }

    const saveResult = await this.repository.save(created.value);
    if (isErr(saveResult)) {
      return saveResult;
    }

    return ok(created.value);
  }
}
