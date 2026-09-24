/**
 * `PreviewImportRoutine` — CA-03.08.3 "un ejercicio 'catalog:no-existe' se
 * convierte en ejercicio personalizado, reps se ajusta a 100, veo la lista
 * de advertencias antes de confirmar".
 *
 * Fase roja: `PreviewImportRoutine` (`F03-T10`) todavía no resuelve
 * referencias inexistentes ni recorta valores fuera de RN-06 (TODO inline
 * en el archivo de producción) — nunca genera advertencias. Estas pruebas
 * deben fallar en la aserción.
 */
import { isOk } from "@/shared/domain/Result";
import { FakeClock } from "@test/fakes/FakeClock";
import { aFitRoutineFileWithProblems } from "@test/fakes/aFitRoutineFile";
import { PreviewImportRoutine } from "../PreviewImportRoutine";

const APP_TIMER_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 90,
  restBetweenRoundsSeconds: 120,
  halfwayCue: false,
};

describe("CA-03.08.3 PreviewImportRoutine — importar con problemas", () => {
  it("convierte 'catalog:no-existe' en advertencia UNKNOWN_EXERCISE_CONVERTED", () => {
    const content = JSON.stringify(aFitRoutineFileWithProblems());
    const useCase = new PreviewImportRoutine(new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);

    const result = useCase.execute(content, content.length);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const hasUnknownExerciseWarning = result.value.warnings.some(
      (warning) => warning.kind === "UNKNOWN_EXERCISE_CONVERTED",
    );
    expect(hasUnknownExerciseWarning).toBe(true);
  });

  it("recorta reps=500 a 100 (RN-06) con advertencia VALUE_CLAMPED", () => {
    const content = JSON.stringify(aFitRoutineFileWithProblems());
    const useCase = new PreviewImportRoutine(new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);

    const result = useCase.execute(content, content.length);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const hasClampedWarning = result.value.warnings.some((warning) => warning.kind === "VALUE_CLAMPED");
    expect(hasClampedWarning).toBe(true);
  });
});
