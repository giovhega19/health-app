/**
 * `PreviewImportRoutine` — CA-03.08.4 "veo 'Esta rutina se creó con una
 * versión más nueva de la app. Actualiza para importarla.'"
 *
 * Fase roja: `PreviewImportRoutine` (`F03-T10`) todavía no compara
 * `schemaVersion` contra `SUPPORTED_SCHEMA_VERSION` (TODO inline en el
 * archivo de producción) — esta prueba debe fallar en la aserción.
 */
import { isErr } from "@/shared/domain/Result";
import { FakeClock } from "@test/fakes/FakeClock";
import { aFitRoutineFileWithUnsupportedVersion } from "@test/fakes/aFitRoutineFile";
import { PreviewImportRoutine } from "../PreviewImportRoutine";

const APP_TIMER_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 90,
  restBetweenRoundsSeconds: 120,
  halfwayCue: false,
};

describe("CA-03.08.4 PreviewImportRoutine — versión no soportada", () => {
  it("rechaza un archivo con schemaVersion mayor que la soportada", () => {
    const content = JSON.stringify(aFitRoutineFileWithUnsupportedVersion());
    const useCase = new PreviewImportRoutine(new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);

    const result = useCase.execute(content, content.length);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("UNSUPPORTED_VERSION");
    }
  });
});
