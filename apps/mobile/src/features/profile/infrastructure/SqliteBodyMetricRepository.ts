import { and, eq, gte, lte } from "drizzle-orm";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { bodyMetrics } from "@/shared/infrastructure/db/schema";
import { BodyMetric } from "../domain/BodyMetric";
import type { BodyMetricRepository, DateRange, RepositoryError } from "../application/ports";

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * `SqliteBodyMetricRepository` (RF-01.06, tarea `F01-T09`). `append` hace
 * upsert por `(profile_id, metric_date)` (índice único
 * `body_metrics_profile_date_unique`, `schema.ts`): CA-01.06.1 "si ya existía
 * un registro de hoy, se reemplaza".
 */
export class SqliteBodyMetricRepository implements BodyMetricRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async append(metric: BodyMetric): Promise<Result<void, RepositoryError>> {
    try {
      const nowIso = this.clock.now().toISOString();
      const metricDate = dateOnly(metric.date);
      const existing = await this.db
        .select()
        .from(bodyMetrics)
        .where(eqProfileAndDate(metric.profileId, metricDate));

      if (existing.length > 0) {
        await this.db
          .update(bodyMetrics)
          .set({
            weightKg: metric.weightKg,
            waistCm: metric.waistCm,
            updatedAt: nowIso,
          })
          .where(eqProfileAndDate(metric.profileId, metricDate));
      } else {
        await this.db.insert(bodyMetrics).values({
          id: metric.id,
          profileId: metric.profileId,
          metricDate,
          weightKg: metric.weightKg,
          waistCm: metric.waistCm,
          updatedAt: nowIso,
          deletedAt: null,
        });
      }

      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async history(range: DateRange): Promise<Result<BodyMetric[], RepositoryError>> {
    try {
      const rows = await this.db
        .select()
        .from(bodyMetrics)
        .where(and(gte(bodyMetrics.metricDate, dateOnly(range.from)), lte(bodyMetrics.metricDate, dateOnly(range.to))));

      return ok(
        rows.map((row) =>
          BodyMetric.create({
            id: asId(row.id),
            profileId: asId(row.profileId),
            date: new Date(row.metricDate),
            weightKg: row.weightKg,
            waistCm: row.waistCm,
          }),
        ),
      );
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async clear(): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(bodyMetrics);
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }
}

function eqProfileAndDate(profileId: string, metricDate: string) {
  return and(eq(bodyMetrics.profileId, profileId), eq(bodyMetrics.metricDate, metricDate));
}

function toRepositoryError(error: unknown): RepositoryError {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "STORAGE_ERROR", message };
}
