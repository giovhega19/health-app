/**
 * `Routine` — pruebas adicionales de cobertura (Art. 3.2: capa `domain`
 * ≥ 90 %) para ramas de RN-06 y rutas de error que los archivos de QA
 * (`Routine.*.test.ts`) no ejercitan explícitamente: límites numéricos por
 * campo (reps, segundos de trabajo, peso, overrides de tiempo, `timerDefaults`),
 * `ITEM_NOT_FOUND`/`BLOCK_NOT_FOUND` en `setOverrides`/`reorderItems`/
 * `removeItem`, y los getters restantes del agregado.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { Routine } from "../Routine";
import { aRoutine, anItem, nextTestId } from "@test/fakes/aRoutine";

const MISSING_ID = asId("00000000-0000-4000-9999-000000000000");

describe("Routine.create — límites numéricos por campo (RN-06)", () => {
  it("rechaza targetReps fuera de rango (>100)", () => {
    const input = aRoutine().withItems(1).build();
    input.blocks[0]!.items[0]!.targetReps = 500;
    const result = Routine.create(input);
    expect(isErr(result)).toBe(true);
  });

  it("rechaza targetSeconds fuera de rango (>600)", () => {
    const item = anItem({ targetReps: undefined, targetSeconds: 700 });
    const input = aRoutine().withBlocks([{ id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [item] }]).build();
    const result = Routine.create(input);
    expect(isErr(result)).toBe(true);
  });

  it("rechaza weightKg fuera de rango (>500)", () => {
    const item = anItem({ weightKg: 999 });
    const input = aRoutine().withBlocks([{ id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [item] }]).build();
    const result = Routine.create(input);
    expect(isErr(result)).toBe(true);
  });

  it("rechaza un timerOverrides de ítem fuera de rango (prepSeconds > 30)", () => {
    const item = anItem({ timerOverrides: { prepSeconds: 99, workSeconds: 40, restBetweenSetsSeconds: 60, restBetweenExercisesSeconds: 90, restBetweenRoundsSeconds: 120, halfwayCue: false } });
    const input = aRoutine().withBlocks([{ id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [item] }]).build();
    const result = Routine.create(input);
    expect(isErr(result)).toBe(true);
  });

  it("rechaza un timerDefaults.prepSeconds fuera de rango", () => {
    const input = aRoutine().withTimerDefaults({ prepSeconds: 999 }).withItems(1).build();
    const result = Routine.create(input);
    expect(isErr(result)).toBe(true);
  });

  it("rechaza un timerDefaults.restBetweenSetsSeconds fuera de rango", () => {
    const input = aRoutine().withTimerDefaults({ restBetweenSetsSeconds: 999 }).withItems(1).build();
    const result = Routine.create(input);
    expect(isErr(result)).toBe(true);
  });

  it("rechaza más de 40 ítems en total entre bloques", () => {
    const input = aRoutine().withItems(41).build();
    const result = Routine.create(input);
    expect(isErr(result)).toBe(true);
  });
});

describe("Routine.setOverrides / reorderItems / removeItem — ítem/bloque no encontrado", () => {
  it("setOverrides devuelve ITEM_NOT_FOUND cuando el ítem no existe", () => {
    const created = Routine.create(aRoutine().withItems(1).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const result = created.value.setOverrides(MISSING_ID, { prepSeconds: 5 });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("ITEM_NOT_FOUND");
    }
  });

  it("reorderItems devuelve BLOCK_NOT_FOUND cuando el bloque no existe", () => {
    const created = Routine.create(aRoutine().withItems(1).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const result = created.value.reorderItems(MISSING_ID, []);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("BLOCK_NOT_FOUND");
    }
  });

  it("removeItem devuelve BLOCK_NOT_FOUND cuando el bloque no existe", () => {
    const created = Routine.create(aRoutine().withItems(1).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const result = created.value.removeItem(MISSING_ID, MISSING_ID);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("BLOCK_NOT_FOUND");
    }
  });

  it("removeItem devuelve ITEM_NOT_FOUND cuando el ítem no existe en el bloque", () => {
    const created = Routine.create(aRoutine().withItems(1).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;
    const blockId = created.value.blocks[0]!.id;

    const result = created.value.removeItem(blockId, MISSING_ID);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("ITEM_NOT_FOUND");
    }
  });
});

describe("Routine — getters", () => {
  it("expone description, goal, level, version, updatedAt y deletedAt", () => {
    const input = aRoutine().withItems(1).build();
    input.description = "Notas de la rutina";
    const created = Routine.create(input);
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    expect(created.value.description).toBe("Notas de la rutina");
    expect(created.value.goal).toBe(input.goal);
    expect(created.value.level).toBe(input.level);
    expect(created.value.version).toBe(input.version);
    expect(created.value.updatedAt).toEqual(input.updatedAt);
    expect(created.value.deletedAt).toBeNull();
  });
});
