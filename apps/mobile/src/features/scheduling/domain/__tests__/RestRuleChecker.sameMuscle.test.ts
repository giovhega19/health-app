/**
 * CA-04.04.2 Mismo grupo muscular (RN-13): "Dado minHoursSameMuscle = 48 y
 * ayer entrené PIERNA, cuando programo otra rutina de PIERNA para hoy,
 * entonces veo una advertencia con una rutina alternativa sugerida."
 * Heurística acotada a H2 (`plan.md` §1 punto 3): la alternativa sugerida es
 * otra rutina que el usuario ya tenga programada en un `ScheduleSlot` activo
 * para un día distinto — no un motor de recomendación por grupo muscular.
 *
 * `RestRuleChecker.checkRestRules` (tarea `F04-T06`) lanza deliberadamente
 * — rojo TDD esperado.
 */
import { checkRestRules } from "../RestRuleChecker";
import type { RestRuleInput } from "../RestRuleChecker";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";
import { asId } from "@/shared/domain/Id";

function baseInput(overrides: Partial<RestRuleInput> = {}): RestRuleInput {
  return {
    now: new Date("2026-09-21T18:00:00Z"),
    targetRoutine: aRoutineSummary({ muscleGroups: ["LEGS"] }),
    minHoursBetweenRoutines: 0,
    minHoursSameMuscle: 48,
    lastSession: null,
    lastSessionSameMuscle: null,
    alternativeRoutines: [],
    ...overrides,
  };
}

describe("CA-04.04.2 RestRuleChecker — mismo grupo muscular", () => {
  it("PIERNA entrenada hace 24 h (< 48 h) -> advertencia con la alternativa disponible", () => {
    const alternative = aRoutineSummary({
      id: asId("00000000-0000-4000-e100-000000000007"),
      muscleGroups: ["CHEST"],
    });

    const warnings = checkRestRules(
      baseInput({
        lastSessionSameMuscle: { completedAt: new Date("2026-09-20T18:00:00Z"), muscleGroups: ["LEGS"] },
        alternativeRoutines: [alternative],
      }),
    );

    expect(warnings).toContainEqual({
      kind: "SAME_MUSCLE_GROUP",
      hoursSinceLastSession: 24,
      minHoursRequired: 48,
      muscleGroups: ["LEGS"],
      suggestedAlternativeRoutineId: alternative.id,
    });
  });

  it("PIERNA entrenada hace 48 h o más -> sin advertencia", () => {
    const warnings = checkRestRules(
      baseInput({ lastSessionSameMuscle: { completedAt: new Date("2026-09-19T18:00:00Z"), muscleGroups: ["LEGS"] } }),
    );

    expect(warnings.some((w) => w.kind === "SAME_MUSCLE_GROUP")).toBe(false);
  });

  it("sin ninguna rutina alternativa ya programada -> la advertencia se emite igual, sin alternativa (plan.md §1 punto 3: heurística acotada)", () => {
    const warnings = checkRestRules(
      baseInput({
        lastSessionSameMuscle: { completedAt: new Date("2026-09-20T18:00:00Z"), muscleGroups: ["LEGS"] },
        alternativeRoutines: [],
      }),
    );

    expect(warnings).toContainEqual(
      expect.objectContaining({ kind: "SAME_MUSCLE_GROUP", suggestedAlternativeRoutineId: null }),
    );
  });
});
