/**
 * CA-03.04.1 Circuito — construcción del bloque CIRCUIT en `Routine` y
 * reutilización (no reimplementación) de `estimateRoutineDurationSeconds`
 * (RN-07, `shared/domain/routineDuration.ts`, ya construido en F02) para
 * verificar que la duración estimada incluye los descansos entre rondas y
 * excluye los descansos entre los ejercicios del circuito.
 *
 * NOTA para el reporte de QA: el estimador de `shared/domain/routineDuration.ts`
 * YA soporta la agrupación CIRCUIT correctamente desde F02 (su `gapsSum` solo
 * aplica `restBetweenExercisesSeconds` cuando `grouping === "STRAIGHT"`) — no
 * hace falta ampliarlo. Lo que está en rojo aquí es la construcción del
 * agregado `Routine` (`Routine.create`), que en su estado de andamiaje actual
 * sí construye el bloque correctamente (pasa las props tal cual), así que la
 * prueba de duración pura pasaría; lo que falla es la prueba que exige que
 * `Routine.create` rechace un circuito con menos de 2 ejercicios (RN-06 no
 * implementada todavía) y cualquier otra invariante de construcción.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { estimateRoutineDurationSeconds } from "@/shared/domain/routineDuration";
import { Routine } from "../Routine";
import { aRoutine, anItem, nextTestId } from "@test/fakes/aRoutine";

describe("CA-03.04.1 Routine — bloque CIRCUITO", () => {
  it("agrupa 4 ejercicios como CIRCUITO de 3 rondas: la duración estimada incluye 2 descansos entre rondas y no incluye descansos entre los ejercicios del circuito", () => {
    const timerDefaults = {
      prepSeconds: 0,
      workSeconds: 40,
      restBetweenSetsSeconds: 0,
      restBetweenExercisesSeconds: 45,
      restBetweenRoundsSeconds: 90,
      halfwayCue: false,
    };
    const items = [
      anItem({ sets: 1, targetReps: 10, timerOverrides: undefined }),
      anItem({ sets: 1, targetReps: 10, timerOverrides: undefined }),
      anItem({ sets: 1, targetReps: 10, timerOverrides: undefined }),
      anItem({ sets: 1, targetReps: 10, timerOverrides: undefined }),
    ];
    const input = aRoutine()
      .withTimerDefaults(timerDefaults)
      .withBlocks([{ id: nextTestId(), type: "MAIN", grouping: "CIRCUIT", rounds: 3, items }])
      .build();

    const created = Routine.create(input);
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const routine = created.value;
    expect(routine.blocks[0]!.grouping).toBe("CIRCUIT");
    expect(routine.blocks[0]!.rounds).toBe(3);
    expect(routine.blocks[0]!.items).toHaveLength(4);

    const duration = estimateRoutineDurationSeconds(
      { timerDefaults: routine.timerDefaults, blocks: routine.blocks },
      routine.timerDefaults,
    );

    // 4 ejercicios × (1 serie × 10 reps × 3s) = 120; sin descanso entre
    // ejercicios (circuito); + 2 descansos entre rondas × 90s = 180; prep 0.
    expect(duration).toBe(300);
  });

  it("RN-06 rechaza un bloque CIRCUITO con 11 rondas (máximo 10 rondas)", () => {
    const input = aRoutine()
      .withBlocks([
        { id: nextTestId(), type: "MAIN", grouping: "CIRCUIT", rounds: 11, items: [anItem(), anItem()] },
      ])
      .build();

    const result = Routine.create(input);

    expect(isErr(result)).toBe(true);
  });
});
