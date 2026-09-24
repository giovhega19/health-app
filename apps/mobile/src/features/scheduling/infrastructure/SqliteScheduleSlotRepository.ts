import { eq, isNull } from "drizzle-orm";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { scheduleSlots } from "@/shared/infrastructure/db/schema";
import { ScheduleSlot } from "../domain/ScheduleSlot";
import type { DayOfWeek } from "../domain/ScheduleSlot";
import type { RepositoryError, ScheduleSlotRepository } from "../application/ports";

/** `SqliteScheduleSlotRepository` (CA-04.01.1, tarea `F04-T07`). */
export class SqliteScheduleSlotRepository implements ScheduleSlotRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async save(slot: ScheduleSlot): Promise<Result<void, RepositoryError>> {
    try {
      const row = {
        id: slot.id,
        routineId: slot.routineId,
        daysOfWeek: slot.daysOfWeek,
        startTime: slot.startTime,
        reminderOffsetMin: slot.reminderOffsetMin,
        active: slot.active,
        updatedAt: this.clock.now().toISOString(),
        deletedAt: slot.deletedAt ? slot.deletedAt.toISOString() : null,
      };
      await this.db.insert(scheduleSlots).values(row).onConflictDoUpdate({ target: scheduleSlots.id, set: row });
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async listActive(): Promise<Result<ScheduleSlot[], RepositoryError>> {
    try {
      const rows = await this.db.select().from(scheduleSlots).where(isNull(scheduleSlots.deletedAt));
      return ok(rows.filter((row) => row.active).map(mapRow));
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async findById(id: Id): Promise<Result<ScheduleSlot | null, RepositoryError>> {
    try {
      const rows = await this.db.select().from(scheduleSlots).where(eq(scheduleSlots.id, id));
      const row = rows[0];
      return ok(row ? mapRow(row) : null);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async cancel(id: Id): Promise<Result<void, RepositoryError>> {
    try {
      const nowIso = this.clock.now().toISOString();
      await this.db.update(scheduleSlots).set({ active: false, deletedAt: nowIso, updatedAt: nowIso }).where(eq(scheduleSlots.id, id));
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  /** Borrado físico completo (hallazgo H2), a diferencia de `cancel` (por id, borrado lógico). */
  async clear(): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(scheduleSlots);
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }
}

interface ScheduleSlotRow {
  id: string;
  routineId: string;
  daysOfWeek: number[];
  startTime: string;
  reminderOffsetMin: number;
  active: boolean;
  updatedAt: string;
  deletedAt: string | null;
}

function mapRow(row: ScheduleSlotRow): ScheduleSlot {
  return ScheduleSlot.fromPersistence(asId(row.id), {
    routineId: asId(row.routineId),
    daysOfWeek: row.daysOfWeek as DayOfWeek[],
    startTime: row.startTime,
    reminderOffsetMin: row.reminderOffsetMin,
    active: row.active,
    updatedAt: new Date(row.updatedAt),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
  });
}

function toRepositoryError(error: unknown): RepositoryError {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "STORAGE_ERROR", message };
}
