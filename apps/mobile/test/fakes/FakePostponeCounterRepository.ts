import { ok } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import { createPostponeCounter } from "@/features/scheduling/domain/PostponeCounter";
import type { PostponeCounter } from "@/features/scheduling/domain/PostponeCounter";
import type { PostponeCounterRepository } from "@/features/scheduling/application/ports";

/** Fake en memoria de `PostponeCounterRepository` (`features/scheduling/application/ports.ts`). */
export class FakePostponeCounterRepository implements PostponeCounterRepository {
  private readonly counters = new Map<string, PostponeCounter>();

  constructor(seed: PostponeCounter[] = []) {
    for (const counter of seed) {
      this.counters.set(this.key(counter.date, counter.scheduleSlotId), counter);
    }
  }

  private key(date: string, scheduleSlotId: Id): string {
    return `${date}:${scheduleSlotId}`;
  }

  async get(date: string, scheduleSlotId: Id) {
    return ok(this.counters.get(this.key(date, scheduleSlotId)) ?? createPostponeCounter(date, scheduleSlotId));
  }

  async save(counter: PostponeCounter) {
    this.counters.set(this.key(counter.date, counter.scheduleSlotId), counter);
    return ok(undefined);
  }
}
