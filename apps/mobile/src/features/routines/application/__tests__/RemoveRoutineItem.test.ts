/**
 * `RemoveRoutineItem` — CA-03.06.1 "al eliminar un ejercicio aparece
 * 'Deshacer' durante 5 s" (la ventana de 5s se prueba en
 * `presentation/stores/__tests__/useRoutineEditorStore.undo.test.ts`; aquí
 * se prueba que el ítem realmente se quita y se devuelve para poder
 * restaurarlo).
 *
 * Fase roja: `Routine.removeItem` (dominio, `F03-T05`) es no-op — esta
 * prueba debe fallar en la aserción.
 */
import { isOk } from "@/shared/domain/Result";
import { Routine } from "../../domain/Routine";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { aRoutine, anItem, nextTestId } from "@test/fakes/aRoutine";
import { RemoveRoutineItem } from "../RemoveRoutineItem";

describe("CA-03.06.1 RemoveRoutineItem", () => {
  it("quita el ítem del bloque, lo persiste y devuelve el ítem eliminado para el 'Deshacer'", async () => {
    const item1 = anItem();
    const item2 = anItem();
    const block = { id: nextTestId(), type: "MAIN" as const, grouping: "STRAIGHT" as const, rounds: 1, items: [item1, item2] };
    const created = Routine.create(aRoutine().withBlocks([block]).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const repository = new FakeRoutineRepository([created.value]);
    const useCase = new RemoveRoutineItem(repository);

    const result = await useCase.execute({ routineId: created.value.id, blockId: block.id, itemId: item1.id });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.removedItem?.id).toBe(item1.id);
    expect(result.value.routine.blocks[0]!.items.map((item) => item.id)).toEqual([item2.id]);
  });
});
