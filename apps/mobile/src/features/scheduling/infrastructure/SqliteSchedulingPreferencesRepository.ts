import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { schedulingPreferences } from "@/shared/infrastructure/db/schema";
import { DEFAULT_SCHEDULING_PREFERENCES } from "../domain/SchedulingPreferences";
import type { SchedulingPreferences } from "../domain/SchedulingPreferences";
import type { RepositoryError, SchedulingPreferencesRepository } from "../application/ports";

const SINGLETON_ID = 1;

/** `SqliteSchedulingPreferencesRepository` (fila única, tarea `F04-T07`). */
export class SqliteSchedulingPreferencesRepository implements SchedulingPreferencesRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async load(): Promise<Result<SchedulingPreferences, RepositoryError>> {
    try {
      const rows = await this.db.select().from(schedulingPreferences);
      const row = rows[0];
      if (!row) {
        return ok(DEFAULT_SCHEDULING_PREFERENCES);
      }
      return ok({
        quietHours: row.quietHoursStart && row.quietHoursEnd ? { start: row.quietHoursStart, end: row.quietHoursEnd } : null,
        maxNotificationsPerDay: row.maxNotificationsPerDay,
        minHoursBetweenRoutines: row.minHoursBetweenRoutines,
        minHoursSameMuscle: row.minHoursSameMuscle,
      });
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async save(preferences: SchedulingPreferences): Promise<Result<void, RepositoryError>> {
    try {
      const row = {
        id: SINGLETON_ID,
        quietHoursStart: preferences.quietHours?.start ?? null,
        quietHoursEnd: preferences.quietHours?.end ?? null,
        maxNotificationsPerDay: preferences.maxNotificationsPerDay,
        minHoursBetweenRoutines: preferences.minHoursBetweenRoutines,
        minHoursSameMuscle: preferences.minHoursSameMuscle,
        updatedAt: this.clock.now().toISOString(),
      };
      await this.db
        .insert(schedulingPreferences)
        .values(row)
        .onConflictDoUpdate({ target: schedulingPreferences.id, set: row });
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
