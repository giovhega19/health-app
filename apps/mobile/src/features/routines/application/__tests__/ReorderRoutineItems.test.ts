/**
 * `ReorderRoutineItems` — CA-03.06.1 "arrastro el ejercicio 3 a la posición
 * 1 ... el orden se actualiza".
 *
 * Fase roja: `Routine.reorderItems` (dominio, `F03-T05`) es no-op — esta
 * prueba debe fallar en la aserción.
 */
import { isOk } from "@/shared/domain/Result";
import { Routine } from "../../domain/Routine";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { aRoutine, anItem, nextTestId } from "@test/fakes/aRoutine";
import { ReorderRoutineItems } from "../ReorderRoutineItems";

describe("CA-03.06.1 ReorderRoutineItems", () => {
  it("actualiza el orden de los ítems del bloque y persiste el cambio", async () => {
    const item1 = anItem();
    const item2 = anItem();
    const item3 = anItem();
    const block = { id: nextTestId(), type: "MAIN" as const, grouping: "STRAIGHT" as const, rounds: 1, items: [item1, item2, item3] };
    const created = Routine.create(aRoutine().withBlocks([block]).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const repository = new FakeRoutineRepository([created.value]);
    const useCase = new ReorderRoutineItems(repository);

    const result = await useCase.execute({
      routineId: created.value.id,
      blockId: block.id,
      orderedItemIds: [item3.id, item1.id, item2.id],
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.blocks[0]!.items.map((item) => item.id)).toEqual([item3.id, item1.id, item2.id]);
    expect(repository.savedRoutines.at(-1)?.blocks[0]!.items.map((item) => item.id)).toEqual([
      item3.id,
      item1.id,
      item2.id,
    ]);
  });
});
