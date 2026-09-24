import { err, ok } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { LookupError, RoutineSummaryLookupPort } from "@/features/scheduling/application/ports";
import type { RoutineSummary } from "@/features/scheduling/domain/NotificationPlanner";

/** Fake en memoria de `RoutineSummaryLookupPort` (`features/scheduling/application/ports.ts`). */
export class FakeRoutineSummaryLookupPort implements RoutineSummaryLookupPort {
  private readonly summaries = new Map<string, RoutineSummary>();

  register(summary: RoutineSummary): void {
    this.summaries.set(summary.id, summary);
  }

  async summarize(routineId: Id) {
    const summary = this.summaries.get(routineId);
    if (!summary) {
      return err<LookupError, RoutineSummary>({ kind: "NOT_FOUND" });
    }
    return ok<RoutineSummary, LookupError>(summary);
  }
}
