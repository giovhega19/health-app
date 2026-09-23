/**
 * `SqliteBodyMetricRepository` (tarea `F01-T09`, integración con SQLite real,
 * ver `test/helpers/createTestDb.ts`). CA-01.06.1: "si ya existía un registro
 * de hoy, se reemplaza" — probado aquí a nivel de SQL real (índice único
 * `body_metrics_profile_date_unique`), a diferencia de `LogBodyWeight.test.ts`
 * (aplicación, con `FakeBodyMetricRepository`).
 */
import { asId, generateId } from "@/shared/domain/Id";
import { isOk } from "@/shared/domain/Result";
import { BodyMetric } from "@/features/profile/domain/BodyMetric";
import { SqliteBodyMetricRepository } from "../SqliteBodyMetricRepository";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";

describe("RF-01.06 SqliteBodyMetricRepository", () => {
  const profileId = asId("00000000-0000-4000-b000-000000000002");

  it("CA-01.06.1 registra un peso nuevo y aparece en el historial", async () => {
    const db = await createTestDb();
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const repository = new SqliteBodyMetricRepository(db, clock);

    const metric = BodyMetric.create({
      id: generateId(clock),
      profileId,
      date: clock.now(),
      weightKg: 59.5,
      waistCm: null,
    });

    const appendResult = await repository.append(metric);
    expect(isOk(appendResult)).toBe(true);

    const historyResult = await repository.history({
      from: new Date("2026-01-01T00:00:00Z"),
      to: new Date("2026-12-31T00:00:00Z"),
    });
    expect(isOk(historyResult)).toBe(true);
    if (!isOk(historyResult)) return;
    expect(historyResult.value).toHaveLength(1);
    expect(historyResult.value[0]?.weightKg).toBe(59.5);
  });

  it("CA-01.06.1 si ya existía un registro de hoy, se reemplaza (upsert por fecha)", async () => {
    const db = await createTestDb();
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const repository = new SqliteBodyMetricRepository(db, clock);

    await repository.append(
      BodyMetric.create({ id: generateId(clock), profileId, date: clock.now(), weightKg: 60, waistCm: null }),
    );
    await repository.append(
      BodyMetric.create({ id: generateId(clock), profileId, date: clock.now(), weightKg: 59.5, waistCm: null }),
    );

    const historyResult = await repository.history({
      from: new Date("2026-01-01T00:00:00Z"),
      to: new Date("2026-12-31T00:00:00Z"),
    });
    if (!isOk(historyResult)) throw new Error("history failed");
    expect(historyResult.value).toHaveLength(1);
    expect(historyResult.value[0]?.weightKg).toBe(59.5);
  });

  it("clear() borra todo el historial (CA-01.08.1)", async () => {
    const db = await createTestDb();
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const repository = new SqliteBodyMetricRepository(db, clock);
    await repository.append(
      BodyMetric.create({ id: generateId(clock), profileId, date: clock.now(), weightKg: 60, waistCm: null }),
    );

    const clearResult = await repository.clear();
    expect(isOk(clearResult)).toBe(true);

    const historyResult = await repository.history({
      from: new Date("2026-01-01T00:00:00Z"),
      to: new Date("2026-12-31T00:00:00Z"),
    });
    if (!isOk(historyResult)) throw new Error("history failed");
    expect(historyResult.value).toHaveLength(0);
  });
});
