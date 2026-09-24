/** `SqlitePostponeCounterRepository` (CA-04.05.1, tarea `F04-T07`, SQLite real). */
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { SqlitePostponeCounterRepository } from "../SqlitePostponeCounterRepository";
import { createTestDb } from "@test/helpers/createTestDb";

const SLOT_ID = asId("00000000-0000-4000-e200-000000000001");

describe("F04-T07 SqlitePostponeCounterRepository", () => {
  it("get() sin fila previa devuelve un contador en 0", async () => {
    const db = await createTestDb();
    const repository = new SqlitePostponeCounterRepository(db);

    const result = await repository.get("2026-09-21", SLOT_ID);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toEqual({ date: "2026-09-21", scheduleSlotId: SLOT_ID, count: 0 });
  });

  it("save() persiste el contador y get() lo devuelve actualizado", async () => {
    const db = await createTestDb();
    const repository = new SqlitePostponeCounterRepository(db);

    await repository.save({ date: "2026-09-21", scheduleSlotId: SLOT_ID, count: 1 });
    await repository.save({ date: "2026-09-21", scheduleSlotId: SLOT_ID, count: 2 });
    const result = await repository.get("2026-09-21", SLOT_ID);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value.count).toBe(2);
  });
});
