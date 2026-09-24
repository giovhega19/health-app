/**
 * `PreviewImportRoutine` — pruebas adicionales de cobertura (Art. 3.2) para
 * ramas no ejercitadas por las pruebas de QA: archivo demasiado grande, JSON
 * inválido, formato inválido, y una referencia `catalog:<id>` que SÍ está en
 * `knownCatalogExerciseIds` (se mantiene como CATALOG, sin advertencia).
 */
import { isErr, isOk } from "@/shared/domain/Result";
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

describe("PreviewImportRoutine — ramas de error y catálogo conocido", () => {
  it("rechaza un archivo mayor a 256 KB (FILE_TOO_LARGE)", () => {
    const useCase = new PreviewImportRoutine(new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);

    const result = useCase.execute("{}", 300 * 1024);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("FILE_TOO_LARGE");
    }
  });

  it("rechaza contenido que no es JSON válido (INVALID_FORMAT)", () => {
    const useCase = new PreviewImportRoutine(new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);

    const result = useCase.execute("no es json", 10);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("INVALID_FORMAT");
    }
  });

  it("rechaza un archivo que no cumple el esquema (INVALID_FORMAT)", () => {
    const useCase = new PreviewImportRoutine(new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);
    const content = JSON.stringify({ schema: "fitapp.routine" });

    const result = useCase.execute(content, content.length);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("INVALID_FORMAT");
    }
  });

  it("una referencia catalog:<id> conocida se mantiene como CATALOG (sin advertencia)", () => {
    const useCase = new PreviewImportRoutine(
      new FakeClock("2026-09-23T10:00:00Z"),
      APP_TIMER_DEFAULTS,
      new Set(["push-up"]),
    );
    const content = JSON.stringify(aValidFitRoutineFile());

    const result = useCase.execute(content, content.length);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const hasUnknownExerciseWarning = result.value.warnings.some(
      (warning) => warning.kind === "UNKNOWN_EXERCISE_CONVERTED" && warning.itemRef === "catalog:push-up",
    );
    expect(hasUnknownExerciseWarning).toBe(false);
  });

  it("un peso (weightKg) fuera de rango se recorta con advertencia VALUE_CLAMPED", () => {
    const useCase = new PreviewImportRoutine(new FakeClock("2026-09-23T10:00:00Z"), APP_TIMER_DEFAULTS);
    const content = JSON.stringify(
      aValidFitRoutineFile({
        routine: {
          name: "Con peso excesivo",
          goal: "GENERAL_HEALTH",
          level: "BEGINNER",
          timerDefaults: { prepSeconds: 10, restBetweenSetsSeconds: 60, restBetweenExercisesSeconds: 90 },
          blocks: [
            {
              type: "MAIN",
              grouping: "STRAIGHT",
              rounds: 1,
              items: [{ exercise: { ref: "catalog:deadlift" }, sets: 3, targetReps: 5, weightKg: 900 }],
            },
          ],
        },
      }),
    );

    const result = useCase.execute(content, content.length);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.warnings.some((warning) => warning.kind === "VALUE_CLAMPED" && warning.field === "weightKg")).toBe(
      true,
    );
  });
});
