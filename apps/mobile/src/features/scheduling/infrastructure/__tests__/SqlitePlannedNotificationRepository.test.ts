/** `SqlitePlannedNotificationRepository` (ADR-010, tarea `F04-T07`, SQLite real). */
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { SqlitePlannedNotificationRepository } from "../SqlitePlannedNotificationRepository";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";

describe("F04-T07 SqlitePlannedNotificationRepository", () => {
  it("replaceAll sustituye por completo la lista y listAll la devuelve", async () => {
    const db = await createTestDb();
    const repository = new SqlitePlannedNotificationRepository(db, new FakeClock("2026-09-21T08:00:00Z"));

    await repository.replaceAll([
      {
        scheduleSlotId: asId("00000000-0000-4000-e200-000000000001"),
        routineId: asId("00000000-0000-4000-e100-000000000001"),
        routineName: "Pierna casa",
        type: "PRE_REMINDER",
        fireAt: new Date("2026-09-21T17:45:00Z"),
        osNotificationId: "os-1",
        delivered: false,
      },
    ]);
    const first = await repository.listAll();
    expect(isOk(first)).toBe(true);
    if (isOk(first)) expect(first.value).toHaveLength(1);

    await repository.replaceAll([]);
    const second = await repository.listAll();
    expect(isOk(second)).toBe(true);
    if (isOk(second)) expect(second.value).toHaveLength(0);
  });
});
