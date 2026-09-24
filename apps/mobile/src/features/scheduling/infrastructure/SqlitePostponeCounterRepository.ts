import { and, eq } from "drizzle-orm";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { postponeCounters } from "@/shared/infrastructure/db/schema";
import { createPostponeCounter } from "../domain/PostponeCounter";
import type { PostponeCounter } from "../domain/PostponeCounter";
import type { PostponeCounterRepository, RepositoryError } from "../application/ports";

/** `SqlitePostponeCounterRepository` (CA-04.05.1, tarea `F04-T07`), 100 % local. */
export class SqlitePostponeCounterRepository implements PostponeCounterRepository {
  constructor(private readonly db: AppDatabase) {}

  async get(date: string, scheduleSlotId: Id): Promise<Result<PostponeCounter, RepositoryError>> {
    try {
      const rows = await this.db
        .select()
        .from(postponeCounters)
        .where(and(eq(postponeCounters.date, date), eq(postponeCounters.scheduleSlotId, scheduleSlotId)));
      const row = rows[0];
      if (!row) {
        return ok(createPostponeCounter(date, scheduleSlotId));
      }
      return ok({ date: row.date, scheduleSlotId: asId(row.scheduleSlotId), count: row.count });
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async save(counter: PostponeCounter): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .insert(postponeCounters)
        .values(counter)
        .onConflictDoUpdate({
          target: [postponeCounters.date, postponeCounters.scheduleSlotId],
          set: { count: counter.count },
        });
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
