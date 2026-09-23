/**
 * RN-07 Duración estimada de la rutina (`05-modelo-dominio-reglas.md` §2):
 *
 *   duración = prep
 *            + Σ(ejercicios)[series × tActivo + (series − 1) × descansoSeries]
 *            + (nEjercicios − 1) × descansoEjercicios
 *            + (rondas − 1) × descansoRondas
 *
 * `tActivo` = `targetSeconds` (modo tiempo) o `targetReps × 3 s` (modo reps).
 * En circuitos/superseries no hay descanso entre ejercicios del grupo: solo
 * al final de cada ronda.
 *
 * `shared/domain/routineDuration.ts` (tarea `F02-T03`) todavía no existe:
 * esta prueba falla ahora mismo con "Cannot find module", el estado rojo
 * esperado. Mencionada explícitamente en `07-estrategia-pruebas.md` §2.5 y
 * `specs/F02-catalogo-propuesta/plan.md` §5 como
 * `shared/domain/__tests__/routineDuration.property.test.ts`.
 */
import fc from "fast-check";
import { estimateRoutineDurationSeconds } from "../routineDuration";
import { asId } from "../Id";

const APP_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 90,
  restBetweenRoundsSeconds: 120,
  halfwayCue: false,
};

/** Rutina de un solo bloque STRAIGHT con un único ejercicio (modo REPS). */
function routineWithSingleExercise(
  sets: number,
  targetReps: number,
  restBetweenSetsSeconds: number,
) {
  return {
    timerDefaults: APP_DEFAULTS,
    blocks: [
      {
        id: asId("00000000-0000-4000-c000-000000000001"),
        type: "MAIN" as const,
        grouping: "STRAIGHT" as const,
        rounds: 1,
        items: [
          {
            id: asId("00000000-0000-4000-c000-000000000002"),
            exerciseId: asId("00000000-0000-4000-c000-000000000003"),
            sets,
            targetReps,
            timerOverrides: { ...APP_DEFAULTS, restBetweenSetsSeconds },
          },
        ],
      },
    ],
  };
}

describe("RN-07 estimateRoutineDurationSeconds — propiedades", () => {
  it("nunca es negativa, para cualquier combinación válida de series/reps/descanso (límites RN-06)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // series (RN-06: 1-10)
        fc.integer({ min: 1, max: 100 }), // reps (RN-06: 1-100)
        fc.integer({ min: 0, max: 600 }), // descanso entre series (RN-06: 0-600 s)
        (sets, reps, restBetweenSets) => {
          const duration = estimateRoutineDurationSeconds(
            routineWithSingleExercise(sets, reps, restBetweenSets),
            APP_DEFAULTS,
          );
          expect(duration).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("crece monótonamente con el número de series, a igualdad de los demás parámetros", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 600 }),
        (sets, reps, restBetweenSets) => {
          const shorter = estimateRoutineDurationSeconds(
            routineWithSingleExercise(sets, reps, restBetweenSets),
            APP_DEFAULTS,
          );
          const longer = estimateRoutineDurationSeconds(
            routineWithSingleExercise(sets + 1, reps, restBetweenSets),
            APP_DEFAULTS,
          );
          expect(longer).toBeGreaterThanOrEqual(shorter);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("nunca decrece cuando aumenta el descanso entre series, a igualdad de los demás parámetros", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }), // series >= 2 para que el descanso entre series aplique
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 595 }),
        (sets, reps, restBetweenSets) => {
          const shorter = estimateRoutineDurationSeconds(
            routineWithSingleExercise(sets, reps, restBetweenSets),
            APP_DEFAULTS,
          );
          const longer = estimateRoutineDurationSeconds(
            routineWithSingleExercise(sets, reps, restBetweenSets + 5),
            APP_DEFAULTS,
          );
          expect(longer).toBeGreaterThanOrEqual(shorter);
        },
      ),
      { numRuns: 200 },
    );
  });
});
