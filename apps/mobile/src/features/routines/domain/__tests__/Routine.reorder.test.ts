/**
 * `Routine.reorderItems` / `Routine.removeItem` — CA-03.06.1 (reordenar y
 * deshacer). La ventana de 5 s del "Deshacer" es un temporizador de UI
 * (`presentation/stores/useRoutineEditorStore.ts`, cubierto en
 * `presentation/stores/__tests__/useRoutineEditorStore.undo.test.ts`); aquí
 * se prueba solo la mutación de dominio subyacente (reordenar de verdad, y
 * que `removeItem` realmente quite el ítem del bloque).
 *
 * Fase roja: ambos métodos (`F03-T05`) son andamiaje mínimo no-op. Estas
 * pruebas deben fallar en la aserción.
 */
import { isOk } from "@/shared/domain/Result";
import type { RoutineBlock } from "@/shared/domain/RoutineBlock";
import { Routine } from "../Routine";
import { aRoutine, anItem, nextTestId } from "@test/fakes/aRoutine";

describe("CA-03.06.1 Routine.reorderItems — arrastrar el ejercicio 3 a la posición 1", () => {
  it("actualiza el orden de los ítems del bloque", () => {
    const item1 = anItem();
    const item2 = anItem();
    const item3 = anItem();
    const block: RoutineBlock = {
      id: nextTestId(),
      type: "MAIN",
      grouping: "STRAIGHT",
      rounds: 1,
      items: [item1, item2, item3],
    };
    const created = Routine.create(aRoutine().withBlocks([block]).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const result = created.value.reorderItems(block.id, [item3.id, item1.id, item2.id]);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const orderedIds = result.value.blocks[0]!.items.map((item) => item.id);
    expect(orderedIds).toEqual([item3.id, item1.id, item2.id]);
  });
});

describe("CA-03.06.1 Routine.removeItem — eliminar un ejercicio", () => {
  it("quita el ítem del bloque (la ventana de 5s para 'Deshacer' es responsabilidad de la UI, no del dominio)", () => {
    const item1 = anItem();
    const item2 = anItem();
    const block: RoutineBlock = { id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [item1, item2] };
    const created = Routine.create(aRoutine().withBlocks([block]).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const result = created.value.removeItem(block.id, item1.id);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const remainingIds = result.value.blocks[0]!.items.map((item) => item.id);
    expect(remainingIds).toEqual([item2.id]);
  });
});
