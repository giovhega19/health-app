/**
 * `Routine.addItem` — CA-03.02.1 (ejercicio por tiempo o por reps) y RN-06
 * (máximo de 40 ejercicios por rutina).
 *
 * Fase roja: `addItem` (`F03-T05`) es andamiaje mínimo no-op — no añade el
 * ítem al bloque. Estas pruebas deben fallar en la aserción.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { Routine } from "../Routine";
import { aRoutine, anItem } from "@test/fakes/aRoutine";

describe("CA-03.02.1 Routine.addItem — ejercicio por tiempo o por reps", () => {
  it('CA-03.02.1 agrega "Plancha" en modo TIME: el ítem guarda targetSeconds, no targetReps', () => {
    const input = aRoutine().withItems(1).build();
    const created = Routine.create(input);
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const blockId = created.value.blocks[0]!.id;
    const plankItem = anItem({ targetReps: undefined, targetSeconds: 30 });

    const result = created.value.addItem(blockId, plankItem);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const addedItems = result.value.blocks[0]!.items;
    expect(addedItems).toHaveLength(2);
    const added = addedItems.find((item) => item.id === plankItem.id);
    expect(added).toBeDefined();
    expect(added?.targetSeconds).toBe(30);
    expect(added?.targetReps).toBeUndefined();
  });

  it("CA-03.02.1 agrega un ejercicio en modo REPS: el ítem guarda targetReps, no targetSeconds", () => {
    const input = aRoutine().withItems(1).build();
    const created = Routine.create(input);
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const blockId = created.value.blocks[0]!.id;
    const repsItem = anItem({ targetReps: 15, targetSeconds: undefined });

    const result = created.value.addItem(blockId, repsItem);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const added = result.value.blocks[0]!.items.find((item) => item.id === repsItem.id);
    expect(added?.targetReps).toBe(15);
    expect(added?.targetSeconds).toBeUndefined();
  });

  it("RN-06 rechaza añadir un ejercicio nº 41 (máximo 40 por rutina)", () => {
    const input = aRoutine().withItems(40).build();
    const created = Routine.create(input);
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const blockId = created.value.blocks[0]!.id;
    const result = created.value.addItem(blockId, anItem());

    expect(isErr(result)).toBe(true);
  });

  it("addItem no encuentra un bloque inexistente", () => {
    const input = aRoutine().withItems(1).build();
    const created = Routine.create(input);
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const result = created.value.addItem(asId("00000000-0000-4000-9999-000000000000"), anItem());

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("BLOCK_NOT_FOUND");
    }
  });
});
