/**
 * `Routine.create` (RN-06 en el constructor, `specs/F03-editor-rutinas/spec.md`).
 *
 * Fase roja: `Routine.create` (`F03-T05`) es andamiaje mínimo que siempre
 * devuelve `ok`, incluso sin nombre o sin ítems — estas pruebas deben fallar
 * en la aserción.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { estimateRoutineDurationSeconds } from "@/shared/domain/routineDuration";
import { Routine } from "../Routine";
import { aRoutine } from "@test/fakes/aRoutine";

describe("RN-06 / CA-03.01.1 Routine.create — rutina mínima válida", () => {
  it('CA-03.01.1 crea la rutina "Pierna casa" con 1 bloque PRINCIPAL y 1 ejercicio de 3×12, source=USER', () => {
    const input = aRoutine().withName("Pierna casa").withItems(1).withSource("USER").build();

    const result = Routine.create(input);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.name).toBe("Pierna casa");
      expect(result.value.source).toBe("USER");
      expect(result.value.itemCount).toBe(1);
    }
  });

  it("CA-03.01.1 la duración estimada se calcula reutilizando estimateRoutineDurationSeconds de shared/domain (RN-07), no una copia", () => {
    const input = aRoutine()
      .withName("Pierna casa")
      .withTimerDefaults({ prepSeconds: 10, restBetweenSetsSeconds: 60 })
      .withItems(1)
      .build();

    const result = Routine.create(input);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const routine = result.value;
    const expected = estimateRoutineDurationSeconds(
      { timerDefaults: routine.timerDefaults, blocks: routine.blocks },
      routine.timerDefaults,
    );
    // La rutina construida debe conservar exactamente los bloques/timerDefaults
    // que alimentan el estimador compartido de RN-07 (no una copia deformada).
    expect(estimateRoutineDurationSeconds({ timerDefaults: routine.timerDefaults, blocks: routine.blocks }, routine.timerDefaults)).toBe(
      expected,
    );
    expect(expected).toBeGreaterThan(0);
  });
});

describe("RN-06 / CA-03.01.2 Routine.create — validación", () => {
  it("CA-03.01.2 rechaza una rutina sin nombre", () => {
    const input = aRoutine().withoutName().withItems(1).build();

    const result = Routine.create(input);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("NAME_REQUIRED");
    }
  });

  it("CA-03.01.2 rechaza una rutina sin ejercicios", () => {
    const input = aRoutine().withName("Sin ejercicios").withoutItems().build();

    const result = Routine.create(input);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("NO_ITEMS");
    }
  });

  it("CA-03.01.2 rechaza una rutina sin nombre y sin ejercicios a la vez", () => {
    const input = aRoutine().withoutName().withoutItems().build();

    const result = Routine.create(input);

    expect(isErr(result)).toBe(true);
  });
});
