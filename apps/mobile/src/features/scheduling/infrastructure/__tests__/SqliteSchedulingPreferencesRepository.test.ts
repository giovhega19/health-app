/** `SqliteSchedulingPreferencesRepository` (fila única, tarea `F04-T07`, SQLite real). */
import { isOk } from "@/shared/domain/Result";
import { SqliteSchedulingPreferencesRepository } from "../SqliteSchedulingPreferencesRepository";
import { DEFAULT_SCHEDULING_PREFERENCES } from "../../domain/SchedulingPreferences";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";

describe("F04-T07 SqliteSchedulingPreferencesRepository", () => {
  it("load() devuelve los valores por defecto cuando no hay fila guardada", async () => {
    const db = await createTestDb();
    const repository = new SqliteSchedulingPreferencesRepository(db, new FakeClock("2026-09-21T08:00:00Z"));

    const result = await repository.load();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toEqual(DEFAULT_SCHEDULING_PREFERENCES);
  });

  it("save() persiste y load() devuelve exactamente lo guardado (fila única)", async () => {
    const db = await createTestDb();
    const repository = new SqliteSchedulingPreferencesRepository(db, new FakeClock("2026-09-21T08:00:00Z"));

    await repository.save({
      quietHours: { start: "23:00", end: "06:00" },
      maxNotificationsPerDay: 5,
      minHoursBetweenRoutines: 12,
      minHoursSameMuscle: 24,
    });
    await repository.save({
      quietHours: null,
      maxNotificationsPerDay: 2,
      minHoursBetweenRoutines: 0,
      minHoursSameMuscle: 48,
    });
    const result = await repository.load();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toEqual({
      quietHours: null,
      maxNotificationsPerDay: 2,
      minHoursBetweenRoutines: 0,
      minHoursSameMuscle: 48,
    });
  });
});
