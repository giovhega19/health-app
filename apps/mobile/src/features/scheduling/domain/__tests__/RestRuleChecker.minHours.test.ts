/**
 * CA-04.04.1 Tiempo mínimo entre rutinas (RN-13): "Dado
 * minHoursBetweenRoutines = 12 y una sesión completada hoy a las 07:00,
 * cuando intento programar o iniciar otra rutina hoy a las 12:00, entonces
 * veo la advertencia 'Han pasado 5 h desde tu última rutina; recomendamos
 * 12 h' y puedo continuar de todas formas (no bloquea)."
 *
 * `RestRuleChecker.checkRestRules` recibe `lastSession` como parámetro
 * (nunca lee un repositorio, `plan.md` §2) y lanza deliberadamente (tarea
 * `F04-T06`) — rojo TDD esperado.
 */
import { checkRestRules } from "../RestRuleChecker";
import type { RestRuleInput } from "../RestRuleChecker";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";

function baseInput(overrides: Partial<RestRuleInput> = {}): RestRuleInput {
  return {
    now: new Date("2026-09-21T12:00:00Z"),
    targetRoutine: aRoutineSummary({ muscleGroups: ["CHEST"] }),
    minHoursBetweenRoutines: 12,
    minHoursSameMuscle: 48,
    lastSession: null,
    lastSessionSameMuscle: null,
    alternativeRoutines: [],
    ...overrides,
  };
}

describe("CA-04.04.1 RestRuleChecker — tiempo mínimo entre rutinas", () => {
  it("5 h desde la última sesión (< 12 h requeridas) -> advertencia no bloqueante con los valores exactos", () => {
    const warnings = checkRestRules(
      baseInput({ lastSession: { completedAt: new Date("2026-09-21T07:00:00Z"), muscleGroups: ["CHEST"] } }),
    );

    expect(warnings).toContainEqual({
      kind: "MIN_HOURS_BETWEEN_ROUTINES",
      hoursSinceLastSession: 5,
      minHoursRequired: 12,
    });
  });

  it("12 h o más desde la última sesión -> sin advertencia", () => {
    const warnings = checkRestRules(
      baseInput({ lastSession: { completedAt: new Date("2026-09-21T00:00:00Z"), muscleGroups: ["CHEST"] } }),
    );

    expect(warnings.some((w) => w.kind === "MIN_HOURS_BETWEEN_ROUTINES")).toBe(false);
  });

  it("minHoursBetweenRoutines = 0 (RN-13, desactivado por defecto) -> nunca advierte aunque la sesión sea reciente", () => {
    const warnings = checkRestRules(
      baseInput({
        minHoursBetweenRoutines: 0,
        lastSession: { completedAt: new Date("2026-09-21T11:59:00Z"), muscleGroups: ["CHEST"] },
      }),
    );

    expect(warnings.some((w) => w.kind === "MIN_HOURS_BETWEEN_ROUTINES")).toBe(false);
  });

  it("sin sesiones previas (NullLastSessionAdapter de H2, plan.md §1) -> nunca advierte, comportamiento seguro por defecto", () => {
    const warnings = checkRestRules(baseInput({ lastSession: null }));

    expect(warnings).toEqual([]);
  });
});
