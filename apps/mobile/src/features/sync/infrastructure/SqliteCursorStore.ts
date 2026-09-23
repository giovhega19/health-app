import type { Clock } from "@/shared/domain/Clock";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { syncCursorState } from "@/shared/infrastructure/db/schema";
import type { CursorStore } from "../application/ports";

/**
 * `SqliteCursorStore` (ADR-002, tarea `F01-T08`): persiste el cursor de
 * `GET /sync/pull` (fila única, `sync_cursor_state`) para que la próxima
 * sincronización siga donde quedó la anterior.
 */
export class SqliteCursorStore implements CursorStore {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async load(): Promise<string | null> {
    const rows = await this.db.select().from(syncCursorState);
    return rows[0]?.cursor ?? null;
  }

  async save(cursor: string | null): Promise<void> {
    const rows = await this.db.select().from(syncCursorState);
    const nowIso = this.clock.now().toISOString();
    if (rows[0]) {
      await this.db
        .update(syncCursorState)
        .set({ cursor, updatedAt: nowIso });
      return;
    }
    await this.db.insert(syncCursorState).values({ cursor, updatedAt: nowIso });
  }
}
