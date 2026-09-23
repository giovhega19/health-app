import { eq, inArray } from "drizzle-orm";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId, generateId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { outbox } from "@/shared/infrastructure/db/schema";
import type { OutboxEntry, OutboxOp, OutboxStatus } from "../domain/OutboxEntry";
import type { OutboxRepository, RepositoryError } from "../application/ports";

/**
 * `SqliteOutboxRepository` (ADR-002, tarea `F01-T08`): implementa
 * `OutboxRepository` sobre Drizzle/SQLite (`schema.ts`, tabla `outbox`).
 */
export class SqliteOutboxRepository implements OutboxRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async enqueue(
    entity: string,
    op: OutboxOp,
    entityId: Id,
    payload: Record<string, unknown> | null,
  ): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.insert(outbox).values({
        id: generateId(this.clock),
        entity,
        op,
        entityId,
        payload,
        createdAt: this.clock.now().toISOString(),
        attempts: 0,
        lastError: null,
        status: "pending",
      });
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async pending(): Promise<Result<OutboxEntry[], RepositoryError>> {
    try {
      const rows = await this.db.select().from(outbox).where(eq(outbox.status, "pending"));
      return ok(rows.map(mapRow));
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async markSent(ids: Id[]): Promise<Result<void, RepositoryError>> {
    try {
      if (ids.length === 0) {
        return ok(undefined);
      }
      await this.db.update(outbox).set({ status: "sent" }).where(inArray(outbox.id, ids));
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async markFailed(id: Id, reason: string): Promise<Result<void, RepositoryError>> {
    try {
      const rows = await this.db.select().from(outbox).where(eq(outbox.id, id));
      const attempts = (rows[0]?.attempts ?? 0) + 1;
      await this.db.update(outbox).set({ status: "failed", lastError: reason, attempts }).where(eq(outbox.id, id));
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async clear(): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(outbox);
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }
}

interface OutboxRow {
  id: string;
  entity: string;
  op: string;
  entityId: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
  lastError: string | null;
  status: string;
}

function mapRow(row: OutboxRow): OutboxEntry {
  return {
    id: asId(row.id),
    entity: row.entity,
    op: row.op as OutboxOp,
    entityId: asId(row.entityId),
    payload: (row.payload as Record<string, unknown> | null) ?? null,
    createdAt: new Date(row.createdAt),
    attempts: row.attempts,
    lastError: row.lastError,
    status: row.status as OutboxStatus,
  };
}

function toRepositoryError(error: unknown): RepositoryError {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "STORAGE_ERROR", message };
}
