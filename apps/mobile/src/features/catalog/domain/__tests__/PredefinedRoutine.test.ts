/**
 * Prueba unitaria añadida por `dev-mobile-rn` (no de QA) para
 * `PredefinedRoutine` (`05-modelo-dominio-reglas.md` §1 class Routine,
 * `source: PREDEFINED`), requerida para cumplir el umbral de cobertura de
 * dominio (Art. 3.2: ≥ 90 %) ya que ninguna prueba de QA ejercita sus
 * getters directamente (solo se usa como fixture de `RecommendationEngine`).
 */
import { PredefinedRoutine } from "../PredefinedRoutine";
import { asId } from "@/shared/domain/Id";

describe("PredefinedRoutine", () => {
  it("expone todos los campos de una rutina predefinida y source='PREDEFINED' (no editable)", () => {
    const timerDefaults = {
      prepSeconds: 10,
      workSeconds: 40,
      restBetweenSetsSeconds: 60,
      restBetweenExercisesSeconds: 90,
      restBetweenRoundsSeconds: 120,
      halfwayCue: false,
    };
    const blocks = [
      {
        id: asId("00000000-0000-4000-f000-000000000001"),
        type: "MAIN" as const,
        grouping: "STRAIGHT" as const,
        rounds: 1,
        items: [
          {
            id: asId("00000000-0000-4000-f000-000000000002"),
            exerciseId: asId("00000000-0000-4000-f000-000000000003"),
            sets: 3,
            targetReps: 10,
          },
        ],
      },
    ];
    const updatedAt = new Date("2026-01-01T00:00:00Z");

    const routine = PredefinedRoutine.create({
      id: asId("00000000-0000-4000-f000-000000000004"),
      name: "Cuerpo completo",
      goal: "GENERAL_HEALTH",
      level: "BEGINNER",
      timerDefaults,
      blocks,
      version: 2,
      updatedAt,
    });

    expect(routine.source).toBe("PREDEFINED");
    expect(routine.name).toBe("Cuerpo completo");
    expect(routine.goal).toBe("GENERAL_HEALTH");
    expect(routine.level).toBe("BEGINNER");
    expect(routine.timerDefaults).toEqual(timerDefaults);
    expect(routine.blocks).toEqual(blocks);
    expect(routine.version).toBe(2);
    expect(routine.updatedAt).toEqual(updatedAt);
  });
});
