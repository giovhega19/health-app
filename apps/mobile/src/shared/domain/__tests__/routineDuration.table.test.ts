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

  it("CA-03.04.1 (F03) circuito de 4 ejercicios y 3 rondas: incluye 2 descansos entre rondas y no incluye descansos entre los ejercicios del circuito", () => {
    // NOTA (F03, fase roja de qa-pruebas): este caso ya pasa con el
    // estimador actual — `gapsSum` en `routineDuration.ts` solo aplica
    // `restBetweenExercisesSeconds` cuando `grouping === "STRAIGHT"`, así
    // que CIRCUIT ya queda cubierto desde F02. Se añade aquí (sin reescribir
    // el archivo, `specs/F03-editor-rutinas/plan.md` §5) como caso de
    // referencia explícito del escenario Gherkin de CA-03.04.1; la
    // construcción del agregado `Routine` para este mismo escenario se
    // prueba, en rojo, en `features/routines/domain/__tests__/Routine.circuit.test.ts`.
    // duración = prep(0) + 4×(1×30s) + 0 (sin descanso entre ejercicios) + 2×90 (rondas) = 300
    const timerDefaults = {
      prepSeconds: 0,
      workSeconds: 40,
      restBetweenSetsSeconds: 0,
      restBetweenExercisesSeconds: 45,
      restBetweenRoundsSeconds: 90,
      halfwayCue: false,
    };
    const routine = {
      timerDefaults,
      blocks: [
        {
          id: blockId(5),
          type: "MAIN" as const,
          grouping: "CIRCUIT" as const,
          rounds: 3,
          items: [
            { id: itemId(7), exerciseId: exerciseId(7), sets: 1, targetReps: 10 },
            { id: itemId(8), exerciseId: exerciseId(8), sets: 1, targetReps: 10 },
            { id: itemId(9), exerciseId: exerciseId(9), sets: 1, targetReps: 10 },
            {
              id: asId("00000000-0000-4000-d200-000000000010"),
              exerciseId: asId("00000000-0000-4000-d000-000000000010"),
              sets: 1,
              targetReps: 10,
            },
          ],
        },
      ],
    };

    expect(estimateRoutineDurationSeconds(routine, timerDefaults)).toBe(300);
  });
});
