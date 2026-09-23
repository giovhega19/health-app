import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { generateId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import type { OutboxEntry, OutboxOp, OutboxRepository, RepositoryError } from "@/features/sync";
import { FakeClock } from "./FakeClock";

/** Fake en memoria de `OutboxRepository` (`features/sync/application/ports.ts`). */
export class FakeOutboxRepository implements OutboxRepository {
  private entries: OutboxEntry[] = [];
  private readonly clock = new FakeClock("2026-09-22T10:00:00Z");

  async enqueue(
    entity: string,
    op: OutboxOp,
    entityId: Id,
    payload: Record<string, unknown> | null,
  ): Promise<Result<void, RepositoryError>> {
    this.entries.push({
      id: generateId(this.clock),
      entity,
      op,
      entityId,
      payload,
      createdAt: this.clock.now(),
      attempts: 0,
      lastError: null,
      status: "pending",
    });
    return ok(undefined);
  }

  pending: () => Promise<Result<OutboxEntry[], RepositoryError>> = async () =>
    ok(this.entries.filter((entry) => entry.status === "pending"));

  async markSent(ids: Id[]): Promise<Result<void, RepositoryError>> {
    for (const entry of this.entries) {
      if (ids.includes(entry.id)) {
        entry.status = "sent";
      }
    }
    return ok(undefined);
  }

  async markFailed(id: Id, reason: string): Promise<Result<void, RepositoryError>> {
    const entry = this.entries.find((candidate) => candidate.id === id);
    if (entry) {
      entry.status = "failed";
      entry.lastError = reason;
      entry.attempts += 1;
    }
    return ok(undefined);
  }

  async clear(): Promise<Result<void, RepositoryError>> {
    this.entries = [];
    return ok(undefined);
  }

  all(): OutboxEntry[] {
    return [...this.entries];
  }
}
