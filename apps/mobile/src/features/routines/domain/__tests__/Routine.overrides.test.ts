/**
 * `Routine.setOverrides` — CA-03.03.1 (tiempos por defecto y overrides,
 * precedencia RN-05: `RoutineItem.timerOverrides` → `Routine.timerDefaults`
 * → Preferences → defaults de la app). Mismo caso de precedencia que
 * `07-estrategia-pruebas.md` §4 ejemplifica para F05, aplicado aquí a la
 * construcción del agregado `Routine` en vez del motor de temporizador.
 *
 * Fase roja: `setOverrides` (`F03-T05`) es andamiaje mínimo no-op — no
 * aplica el override al ítem. Estas pruebas deben fallar en la aserción.
 */
import { isOk } from "@/shared/domain/Result";
import type { RoutineBlock } from "@/shared/domain/RoutineBlock";
import { Routine } from "../Routine";
import { aRoutine, anItem, nextTestId } from "@test/fakes/aRoutine";

describe("RN-05 / CA-03.03.1 Routine.setOverrides — precedencia de tiempos", () => {
  it('CA-03.03.1 con timerDefaults.restBetweenSetsSeconds=60, un override de 30s en "Flexiones" deja ese ítem en 30s y los demás en 60s (heredado)', () => {
    const flexiones = anItem();
    const squats = anItem();
    const block: RoutineBlock = {
      id: nextTestId(),
      type: "MAIN",
      grouping: "STRAIGHT",
      rounds: 1,
      items: [flexiones, squats],
    };
    const input = aRoutine().withTimerDefaults({ restBetweenSetsSeconds: 60 }).withBlocks([block]).build();

    const created = Routine.create(input);
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const result = created.value.setOverrides(flexiones.id, { restBetweenSetsSeconds: 30 });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const updatedFlexiones = result.value.blocks[0]!.items.find((item) => item.id === flexiones.id);
    const updatedSquats = result.value.blocks[0]!.items.find((item) => item.id === squats.id);

    // CA-03.03.1: "Flexiones" muestra 30 s (override propio).
    expect(updatedFlexiones?.timerOverrides?.restBetweenSetsSeconds).toBe(30);
    // "los demás ejercicios 60 s": sin override propio, heredan timerDefaults (RN-05).
    expect(updatedSquats?.timerOverrides).toBeUndefined();
  });

  it("CA-03.03.1 el ítem con override queda marcado (timerOverrides definido) para el indicador visual", () => {
    const item = anItem();
    const block: RoutineBlock = { id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [item] };
    const input = aRoutine().withBlocks([block]).build();

    const created = Routine.create(input);
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const result = created.value.setOverrides(item.id, { prepSeconds: 5 });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const updated = result.value.blocks[0]!.items.find((candidate) => candidate.id === item.id);
    expect(updated?.timerOverrides).toBeDefined();
  });
});
