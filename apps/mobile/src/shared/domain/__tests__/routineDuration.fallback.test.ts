/**
 * Pruebas unitarias añadidas por `dev-mobile-rn` (no de QA) para cubrir las
 * ramas de `estimateRoutineDurationSeconds` que las pruebas de tabla/
 * propiedades de QA no ejercitan: la precedencia RN-05 hacia `appDefaults`
 * cuando `routine.timerDefaults` no define un campo, y un `RoutineItem` sin
 * `targetReps` ni `targetSeconds` (tiempo activo 0). Requeridas para cumplir
 * el umbral de cobertura de dominio (Art. 3.2: ≥ 90 %).
 */
import { estimateRoutineDurationSeconds } from "../routineDuration";
import { asId } from "../Id";
import type { TimerSettings } from "../TimerSettings";

const APP_DEFAULTS: TimerSettings = {
  prepSeconds: 7,
  workSeconds: 40,
  restBetweenSetsSeconds: 33,
  restBetweenExercisesSeconds: 44,
  restBetweenRoundsSeconds: 55,
  halfwayCue: false,
};

describe("estimateRoutineDurationSeconds — ramas adicionales (RN-05 fallback a appDefaults)", () => {
  it("usa appDefaults.prepSeconds cuando routine.timerDefaults no lo define", () => {
    const partialDefaults = { ...APP_DEFAULTS, prepSeconds: undefined as unknown as number };
    const routine = {
      timerDefaults: partialDefaults,
      blocks: [],
    };

    expect(estimateRoutineDurationSeconds(routine, APP_DEFAULTS)).toBe(APP_DEFAULTS.prepSeconds);
  });

  it("usa appDefaults.restBetweenSetsSeconds cuando routine.timerDefaults no lo define y el item no tiene override", () => {
    const partialDefaults = {
      ...APP_DEFAULTS,
      restBetweenSetsSeconds: undefined as unknown as number,
    };
    const routine = {
      timerDefaults: partialDefaults,
      blocks: [
        {
          id: asId("00000000-0000-4000-e000-000000000001"),
          type: "MAIN" as const,
          grouping: "STRAIGHT" as const,
          rounds: 1,
          items: [
            {
              id: asId("00000000-0000-4000-e000-000000000002"),
              exerciseId: asId("00000000-0000-4000-e000-000000000003"),
              sets: 2,
              targetReps: 10,
            },
          ],
        },
      ],
    };

    // prep(7) + [2×30 + 1×33] = 7 + 60 + 33 = 100
    expect(estimateRoutineDurationSeconds(routine, APP_DEFAULTS)).toBe(100);
  });

  it("un RoutineItem sin targetReps ni targetSeconds tiene tiempo activo 0", () => {
    const routine = {
      timerDefaults: APP_DEFAULTS,
      blocks: [
        {
          id: asId("00000000-0000-4000-e000-000000000004"),
          type: "MAIN" as const,
          grouping: "STRAIGHT" as const,
          rounds: 1,
          items: [
            {
              id: asId("00000000-0000-4000-e000-000000000005"),
              exerciseId: asId("00000000-0000-4000-e000-000000000006"),
              sets: 1,
            },
          ],
        },
      ],
    };

    // prep(7) + [1×0 + 0×33] = 7
    expect(estimateRoutineDurationSeconds(routine, APP_DEFAULTS)).toBe(7);
  });
});
