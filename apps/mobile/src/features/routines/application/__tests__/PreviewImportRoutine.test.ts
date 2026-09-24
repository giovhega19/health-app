/**
 * `PreviewImportRoutine` — CA-03.08.2 "veo una vista previa (ejercicios,
 * duración)" sin persistir nada.
 */
import { isOk } from "@/shared/domain/Result";
import { FakeClock } from "@test/fakes/FakeClock";
import { aValidFitRoutineFile } from "@test/fakes/aFitRoutineFile";
import { PreviewImportRoutine } from "../PreviewImportRoutine";

const APP_TIMER_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 90,
  restBetweenRoundsSeconds: 120,
  halfwayCue: false,
};

describe("CA-03.08.2 PreviewImportRoutine — vista previa de un archivo válido", () => {
  it("devuelve nombre, número de ejercicios y duración estimada sin persistir", () => {
    const content = JSON.stringify(aValidFitRoutineFile());
    const useCase = new PreviewImportRoutine(new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);

    const result = useCase.execute(content, content.length);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.name).toBe("Pecho y flexiones");
    expect(result.value.itemCount).toBe(2);
    expect(result.value.estimatedDurationSeconds).toBeGreaterThan(0);
  });
});
