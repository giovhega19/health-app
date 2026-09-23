/**
 * RN-07 Duración estimada de la rutina (`05-modelo-dominio-reglas.md` §2) —
 * tabla de casos con valores de referencia calculados a mano a partir de la
 * fórmula exacta de la RN, para complementar las propiedades genéricas de
 * `routineDuration.property.test.ts` con números concretos verificables.
 *
 * `shared/domain/routineDuration.ts` (tarea `F02-T03`) todavía no existe:
 * esta prueba falla ahora mismo con "Cannot find module", el estado rojo
 * esperado.
 */
import { estimateRoutineDurationSeconds } from "../routineDuration";
import { asId } from "../Id";

const exerciseId = (n: number) => asId(`00000000-0000-4000-d000-00000000000${n}`);
const blockId = (n: number) => asId(`00000000-0000-4000-d100-00000000000${n}`);
const itemId = (n: number) => asId(`00000000-0000-4000-d200-00000000000${n}`);

describe("RN-07 estimateRoutineDurationSeconds — tabla de valores de referencia", () => {
  it("un ejercicio, modo REPS, 3 series de 10 reps (tActivo=30s), descanso 60s, prep 10s → 220 s", () => {
    // duración = prep(10) + [3×30 + 2×60] = 10 + [90 + 120] = 220
    const routine = {
      timerDefaults: {
        prepSeconds: 10,
        workSeconds: 40,
        restBetweenSetsSeconds: 60,
        restBetweenExercisesSeconds: 90,
        restBetweenRoundsSeconds: 120,
        halfwayCue: false,
      },
      blocks: [
        {
          id: blockId(1),
          type: "MAIN" as const,
          grouping: "STRAIGHT" as const,
          rounds: 1,
          items: [
            {
              id: itemId(1),
              exerciseId: exerciseId(1),
              sets: 3,
              targetReps: 10,
            },
          ],
        },
      ],
    };

    expect(estimateRoutineDurationSeconds(routine, routine.timerDefaults)).toBe(220);
  });

  it("dos ejercicios en STRAIGHT, 2 series de 10 reps cada uno, descanso entre series 30s, entre ejercicios 45s, prep 5s → 230 s", () => {
    // por ejercicio: 2×30 + 1×30 = 90; dos ejercicios = 180
    // + (2-1)×45 = 45; + prep 5 → 230
    const timerDefaults = {
      prepSeconds: 5,
      workSeconds: 40,
      restBetweenSetsSeconds: 30,
      restBetweenExercisesSeconds: 45,
      restBetweenRoundsSeconds: 120,
      halfwayCue: false,
    };
    const routine = {
      timerDefaults,
      blocks: [
        {
          id: blockId(2),
          type: "MAIN" as const,
          grouping: "STRAIGHT" as const,
          rounds: 1,
          items: [
            { id: itemId(2), exerciseId: exerciseId(2), sets: 2, targetReps: 10 },
            { id: itemId(3), exerciseId: exerciseId(3), sets: 2, targetReps: 10 },
          ],
        },
      ],
    };

    expect(estimateRoutineDurationSeconds(routine, timerDefaults)).toBe(230);
  });

  it("circuito de 2 rondas, 2 ejercicios (uno modo REPS, otro modo TIME), sin descanso entre ejercicios del grupo (RN-07), descanso entre rondas 90s, prep 10s → 150 s", () => {
    // ex1: 1 serie × (10 reps × 3s) = 30; ex2: 1 serie × 20s (targetSeconds) = 20
    // suma ejercicios = 50; sin descansoEjercicios (circuito); + (2-1)×90 = 90
    // + prep 10 → 150
    const timerDefaults = {
      prepSeconds: 10,
      workSeconds: 40,
      restBetweenSetsSeconds: 60,
      restBetweenExercisesSeconds: 45,
      restBetweenRoundsSeconds: 90,
      halfwayCue: false,
    };
    const routine = {
      timerDefaults,
      blocks: [
        {
          id: blockId(3),
          type: "MAIN" as const,
          grouping: "CIRCUIT" as const,
          rounds: 2,
          items: [
            { id: itemId(4), exerciseId: exerciseId(4), sets: 1, targetReps: 10 },
            { id: itemId(5), exerciseId: exerciseId(5), sets: 1, targetSeconds: 20 },
          ],
        },
      ],
    };

    expect(estimateRoutineDurationSeconds(routine, timerDefaults)).toBe(150);
  });

  it("un ejercicio de una sola serie no tiene descanso entre series (series - 1 = 0)", () => {
    // duración = prep(0) + [1×30 + 0×60] = 30
    const timerDefaults = {
      prepSeconds: 0,
      workSeconds: 40,
      restBetweenSetsSeconds: 60,
      restBetweenExercisesSeconds: 90,
      restBetweenRoundsSeconds: 120,
      halfwayCue: false,
    };
    const routine = {
      timerDefaults,
      blocks: [
        {
          id: blockId(4),
          type: "MAIN" as const,
          grouping: "STRAIGHT" as const,
          rounds: 1,
          items: [{ id: itemId(6), exerciseId: exerciseId(6), sets: 1, targetReps: 10 }],
        },
      ],
    };

    expect(estimateRoutineDurationSeconds(routine, timerDefaults)).toBe(30);
  });
});
