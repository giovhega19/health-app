/**
 * `SqlitePredefinedRoutineRepository` (tarea `F02-T08`, integración con
 * SQLite real). CA-02.04.1/CA-02.04.2 (RN-14) consumen `all()` a través de
 * `GenerateProposal`; esta prueba verifica que el árbol
 * rutina -> bloques -> ítems se reconstruye igual a como se guardó,
 * incluyendo la normalización de `routine_blocks`/`routine_items`
 * (`specs/F02-catalogo-propuesta/plan.md` §4).
 */
import { isOk } from "@/shared/domain/Result";
import { SqlitePredefinedRoutineRepository } from "../SqlitePredefinedRoutineRepository";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";
import { ROUTINE_IDS, seedRoutines } from "@test/fakes/aCatalogSnapshot";

describe("RF-02.03 SqlitePredefinedRoutineRepository", () => {
  it("persiste rutinas con sus bloques/ítems y los reconstruye con all()", async () => {
    const db = await createTestDb();
    const repository = new SqlitePredefinedRoutineRepository(db, new FakeClock("2026-09-22T10:00:00Z"));

    await repository.upsertMany(seedRoutines());
    const result = await repository.all();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toHaveLength(seedRoutines().length);

    const upperLower = result.value.find((routine) => routine.id === ROUTINE_IDS.upperLowerDumbbells);
    expect(upperLower).toBeDefined();
    expect(upperLower?.blocks).toHaveLength(1);
    expect(upperLower?.blocks[0]?.items).toHaveLength(3);
    expect(upperLower?.blocks[0]?.items[0]?.sets).toBe(4);
  });

  it("upsertMany reescribe bloques/ítems sin dejar filas huérfanas al actualizar una rutina", async () => {
    const db = await createTestDb();
    const repository = new SqlitePredefinedRoutineRepository(db, new FakeClock("2026-09-22T10:00:00Z"));

    await repository.upsertMany(seedRoutines());
    await repository.upsertMany(seedRoutines());

    const result = await repository.all();
    if (!isOk(result)) throw new Error("all() failed");
    const upperLower = result.value.find((routine) => routine.id === ROUTINE_IDS.upperLowerDumbbells);
    expect(upperLower?.blocks).toHaveLength(1);
    expect(upperLower?.blocks[0]?.items).toHaveLength(3);
  });
});
