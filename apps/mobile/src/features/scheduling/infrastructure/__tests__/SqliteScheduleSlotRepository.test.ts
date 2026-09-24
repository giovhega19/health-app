/** `SqliteScheduleSlotRepository` (CA-04.01.1, tarea `F04-T07`, SQLite real). */
import { isOk } from "@/shared/domain/Result";
import { ScheduleSlot } from "../../domain/ScheduleSlot";
import { SqliteScheduleSlotRepository } from "../SqliteScheduleSlotRepository";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";
import { asId } from "@/shared/domain/Id";

describe("F04-T07 SqliteScheduleSlotRepository", () => {
  it("guarda un slot y lo reconstruye con findById/listActive", async () => {
    const db = await createTestDb();
    const repository = new SqliteScheduleSlotRepository(db, new FakeClock("2026-09-21T08:00:00Z"));
    const created = ScheduleSlot.create({
      id: asId("00000000-0000-4000-e200-000000000090"),
      routineId: asId("00000000-0000-4000-e100-000000000001"),
      daysOfWeek: [1, 4],
      startTime: "18:00",
      reminderOffsetMin: 15,
      now: new Date("2026-09-21T08:00:00Z"),
    });
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    await repository.save(created.value);
    const found = await repository.findById(created.value.id);
    const active = await repository.listActive();

    expect(isOk(found)).toBe(true);
    if (isOk(found)) {
      expect(found.value?.daysOfWeek).toEqual([1, 4]);
    }
    expect(isOk(active)).toBe(true);
    if (isOk(active)) {
      expect(active.value).toHaveLength(1);
    }
  });

  it("cancel() desactiva el slot: ya no aparece en listActive", async () => {
    const db = await createTestDb();
    const repository = new SqliteScheduleSlotRepository(db, new FakeClock("2026-09-21T08:00:00Z"));
    const created = ScheduleSlot.create({
      id: asId("00000000-0000-4000-e200-000000000091"),
      routineId: asId("00000000-0000-4000-e100-000000000001"),
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
      now: new Date("2026-09-21T08:00:00Z"),
    });
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    await repository.save(created.value);
    await repository.cancel(created.value.id);
    const active = await repository.listActive();

    expect(isOk(active)).toBe(true);
    if (isOk(active)) {
      expect(active.value).toHaveLength(0);
    }
  });
});
