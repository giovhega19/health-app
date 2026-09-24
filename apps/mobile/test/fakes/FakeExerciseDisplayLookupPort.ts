import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type {
  ExerciseDisplayLookupPort,
  ExerciseDisplaySummary,
  ExerciseRef,
} from "@/features/routines/application/ports";
import type { LookupError } from "@/features/routines/domain/errors";

/** Fake en memoria de `ExerciseDisplayLookupPort` (`features/routines/application/ports.ts`). */
export class FakeExerciseDisplayLookupPort implements ExerciseDisplayLookupPort {
  readonly calls: ExerciseRef[] = [];
  private readonly byKey = new Map<string, ExerciseDisplaySummary>();

  register(ref: ExerciseRef, summary: ExerciseDisplaySummary): void {
    this.byKey.set(`${ref.source}:${ref.id}`, summary);
  }

  async resolve(ref: ExerciseRef): Promise<Result<ExerciseDisplaySummary, LookupError>> {
    this.calls.push(ref);
    const found = this.byKey.get(`${ref.source}:${ref.id}`);
    if (!found) {
      return err({ kind: "NOT_FOUND" });
    }
    return ok(found);
  }
}
