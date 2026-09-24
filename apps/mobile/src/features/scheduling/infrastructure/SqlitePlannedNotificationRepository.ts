import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId, generateId } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { plannedNotifications } from "@/shared/infrastructure/db/schema";
import type { NotificationType } from "../domain/NotificationPlanner";
import type {
  PlannedNotificationRecord,
  PlannedNotificationRepository,
  RepositoryError,
} from "../application/ports";

/**
 * `SqlitePlannedNotificationRepository` (ADR-010, tarea `F04-T07`): 100 %
 * local (`plan.md` §4), nunca sincronizada — se recalcula entera en cada
 * `ReplanNotificationWindow.execute()` (`replaceAll`).
 */
export class SqlitePlannedNotificationRepository implements PlannedNotificationRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async listAll(): Promise<Result<PlannedNotificationRecord[], RepositoryError>> {
    try {
      const rows = await this.db.select().from(plannedNotifications);
      return ok(rows.map(mapRow));
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async replaceAll(notifications: PlannedNotificationRecord[]): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(plannedNotifications);
      for (const notification of notifications) {
        await this.db.insert(plannedNotifications).values({
          id: generateId(this.clock),
          scheduleSlotId: notification.scheduleSlotId,
          routineId: notification.routineId,
          routineName: notification.routineName,
          type: notification.type,
          fireAt: notification.fireAt.toISOString(),
          osNotificationId: notification.osNotificationId,
          delivered: notification.delivered,
        });
      }
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }
}

interface PlannedNotificationRow {
  scheduleSlotId: string;
  routineId: string;
  routineName: string;
  type: string;
  fireAt: string;
  osNotificationId: string | null;
  delivered: boolean;
}

function mapRow(row: PlannedNotificationRow): PlannedNotificationRecord {
  return {
    scheduleSlotId: asId(row.scheduleSlotId),
    routineId: asId(row.routineId),
    routineName: row.routineName,
    type: row.type as NotificationType,
    fireAt: new Date(row.fireAt),
    osNotificationId: row.osNotificationId,
    delivered: row.delivered,
  };
}

function toRepositoryError(error: unknown): RepositoryError {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "STORAGE_ERROR", message };
}
