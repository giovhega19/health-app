/**
 * `CreateRoutine` — CA-03.01.1 (crear rutina mínima), CA-03.01.2
 * (validación), CA-03.02.1 (ejercicio por tiempo o por reps).
 *
 * Fase roja: `Routine.create` (dominio, `F03-T05`) no valida RN-06 todavía,
 * así que las pruebas de CA-03.01.2 deben fallar en la aserción.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { anItem, nextTestId } from "@test/fakes/aRoutine";
import { CreateRoutine } from "../CreateRoutine";

const APP_TIMER_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 90,
  restBetweenRoundsSeconds: 120,
  halfwayCue: false,
};

describe("CA-03.01.1 CreateRoutine — rutina mínima", () => {
  it('crea la rutina "Pierna casa" con 1 bloque PRINCIPAL y 1 ejercicio de 3×12, guarda y aparece con source=USER', async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new CreateRoutine(repository, new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);

    const result = await useCase.execute({
      name: "Pierna casa",
      goal: "GENERAL_HEALTH",
      level: "BEGINNER",
      timerDefaults: APP_TIMER_DEFAULTS,
      blocks: [
        {
          id: nextTestId(),
          type: "MAIN",
          grouping: "STRAIGHT",
          rounds: 1,
          items: [anItem({ sets: 3, targetReps: 12 })],
        },
      ],
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.routine.source).toBe("USER");
    expect(repository.savedRoutines).toHaveLength(1);
    // CA-03.01.1: "muestra la duración estimada según RN-07" (reutiliza
    // estimateRoutineDurationSeconds, no una copia).
    expect(result.value.estimatedDurationSeconds).toBeGreaterThan(0);
  });

  it('CA-03.02.1 agrega "Plancha" en modo TIME: el resumen conserva targetSeconds en vez de reps', async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new CreateRoutine(repository, new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);

    const result = await useCase.execute({
      name: "Core",
      goal: "GENERAL_HEALTH",
      level: "BEGINNER",
      timerDefaults: APP_TIMER_DEFAULTS,
      blocks: [
        {
          id: nextTestId(),
          type: "MAIN",
          grouping: "STRAIGHT",
          rounds: 1,
          items: [anItem({ targetReps: undefined, targetSeconds: 30 })],
        },
      ],
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const item = result.value.routine.blocks[0]!.items[0]!;
    expect(item.targetSeconds).toBe(30);
    expect(item.targetReps).toBeUndefined();
  });
});

describe("CA-03.01.2 CreateRoutine — validación", () => {
  it("rechaza una rutina sin nombre y no la guarda", async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new CreateRoutine(repository, new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);

    const result = await useCase.execute({
      name: "",
      goal: "GENERAL_HEALTH",
      level: "BEGINNER",
      timerDefaults: APP_TIMER_DEFAULTS,
      blocks: [{ id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [anItem()] }],
    });

    expect(isErr(result)).toBe(true);
    expect(repository.savedRoutines).toHaveLength(0);
  });

  it("rechaza una rutina sin ejercicios y no la guarda", async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new CreateRoutine(repository, new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);

    const result = await useCase.execute({
      name: "Sin ejercicios",
      goal: "GENERAL_HEALTH",
      level: "BEGINNER",
      timerDefaults: APP_TIMER_DEFAULTS,
      blocks: [{ id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [] }],
    });

    expect(isErr(result)).toBe(true);
    expect(repository.savedRoutines).toHaveLength(0);
  });
});
