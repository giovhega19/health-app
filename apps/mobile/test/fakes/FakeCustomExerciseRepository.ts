import { ok } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { CustomExercise } from "@/features/routines/domain/CustomExercise";
import type { CustomExerciseRepository } from "@/features/routines/application/ports";

/** Fake en memoria de `CustomExerciseRepository` (`features/routines/application/ports.ts`). */
export class FakeCustomExerciseRepository implements CustomExerciseRepository {
  private readonly byId = new Map<Id, CustomExercise>();
  readonly savedExercises: CustomExercise[] = [];

  constructor(seed: CustomExercise[] = []) {
    for (const exercise of seed) {
      this.byId.set(exercise.id, exercise);
    }
  }

  async save(exercise: CustomExercise) {
    this.byId.set(exercise.id, exercise);
    this.savedExercises.push(exercise);
    return ok(undefined);
  }

  async findById(id: Id) {
    return ok(this.byId.get(id) ?? null);
  }

  clearCalls = 0;

  async clear() {
    this.clearCalls += 1;
    this.byId.clear();
    return ok(undefined);
  }
}
