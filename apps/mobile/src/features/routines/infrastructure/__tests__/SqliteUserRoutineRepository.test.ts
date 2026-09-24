/**
 * `SqliteUserRoutineRepository` (tarea `F03-T07`, integración con SQLite
 * real). Verifica que reutiliza `routine_blocks`/`routine_items` (F02) sin
 * romper su forma, y que `save`/`findById`/`listActive`/`softDelete`
 * funcionan sobre SQL real.
 */
import { isOk } from "@/shared/domain/Result";
import { Routine } from "../../domain/Routine";
import { SqliteUserRoutineRepository } from "../SqliteUserRoutineRepository";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";
import { aRoutine, anItem, nextTestId } from "@test/fakes/aRoutine";

describe("F03-T07 SqliteUserRoutineRepository", () => {
  it("guarda una rutina con bloques/ítems y la reconstruye con findById", async () => {
    const db = await createTestDb();
    const repository = new SqliteUserRoutineRepository(db, new FakeClock("2026-09-23T10:00:00Z"));
    const customItem = anItem({ exerciseSource: "CUSTOM" });
    const block = { id: nextTestId(), type: "MAIN" as const, grouping: "STRAIGHT" as const, rounds: 1, items: [anItem(), customItem] };
    const created = Routine.create(aRoutine().withName("Pierna casa").withBlocks([block]).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    await repository.save(created.value);
    const found = await repository.findById(created.value.id);

    expect(isOk(found)).toBe(true);
    if (!isOk(found) || !found.value) return;
    expect(found.value.name).toBe("Pierna casa");
    expect(found.value.blocks[0]!.items).toHaveLength(2);
    expect(found.value.blocks[0]!.items[1]!.exerciseSource).toBe("CUSTOM");
  });

  it("listActive no incluye rutinas eliminadas (softDelete)", async () => {
    const db = await createTestDb();
    const repository = new SqliteUserRoutineRepository(db, new FakeClock("2026-09-23T10:00:00Z"));
    const created = Routine.create(aRoutine().withItems(1).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    await repository.save(created.value);
    await repository.softDelete(created.value.id);
    const active = await repository.listActive();

    expect(isOk(active)).toBe(true);
    if (!isOk(active)) return;
    expect(active.value.find((routine) => routine.id === created.value.id)).toBeUndefined();
  });

  it("save() reescribe bloques/ítems sin dejar filas huérfanas al actualizar", async () => {
    const db = await createTestDb();
    const repository = new SqliteUserRoutineRepository(db, new FakeClock("2026-09-23T10:00:00Z"));
    const created = Routine.create(aRoutine().withItems(3).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    await repository.save(created.value);
    const removed = created.value.removeItem(created.value.blocks[0]!.id, created.value.blocks[0]!.items[0]!.id);
    expect(isOk(removed)).toBe(true);
    if (!isOk(removed)) return;
    await repository.save(removed.value);

    const found = await repository.findById(created.value.id);
    expect(isOk(found)).toBe(true);
    if (!isOk(found) || !found.value) return;
    expect(found.value.blocks[0]!.items).toHaveLength(2);
  });
});
