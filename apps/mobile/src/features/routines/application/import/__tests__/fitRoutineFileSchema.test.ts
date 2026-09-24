/**
 * `fitRoutineFileSchema` (RF-03.08, ADR-009) — validación estructural de
 * `.fitroutine.json`. Soporta CA-03.08.1…CA-03.08.4 (usado por
 * `PreviewImportRoutine`/`ConfirmImportRoutine`/`ExportRoutine`).
 */
import { aFitRoutineFileWithUnsupportedVersion, aValidFitRoutineFile } from "@test/fakes/aFitRoutineFile";
import { fitRoutineFileSchema } from "../fitRoutineFileSchema";

describe("RF-03.08 fitRoutineFileSchema — casos válidos", () => {
  it("acepta un archivo .fitroutine.json bien formado (ejemplo de 06-contratos-api.md §4)", () => {
    const result = fitRoutineFileSchema.safeParse(aValidFitRoutineFile());
    expect(result.success).toBe(true);
  });

  it("CA-03.08.4 acepta estructuralmente un schemaVersion futuro (el rechazo por versión es responsabilidad de PreviewImportRoutine, no de zod)", () => {
    const result = fitRoutineFileSchema.safeParse(aFitRoutineFileWithUnsupportedVersion());
    expect(result.success).toBe(true);
  });
});

describe("RF-03.08 fitRoutineFileSchema — casos inválidos", () => {
  it("rechaza un archivo sin el campo routine.name", () => {
    const invalid = aValidFitRoutineFile();
    const routine = invalid.routine as Record<string, unknown>;
    delete routine.name;

    const result = fitRoutineFileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rechaza un archivo con schema distinto de 'fitapp.routine'", () => {
    const invalid = aValidFitRoutineFile({ schema: "other.format" });
    const result = fitRoutineFileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rechaza un bloque sin ítems", () => {
    const invalid = aValidFitRoutineFile({
      routine: {
        name: "Rutina vacía",
        goal: "GENERAL_HEALTH",
        level: "BEGINNER",
        timerDefaults: {},
        blocks: [{ type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [] }],
      },
    });

    const result = fitRoutineFileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rechaza una referencia de ejercicio personalizado sin muscleGroups", () => {
    const invalid = aValidFitRoutineFile({
      routine: {
        name: "Rutina con ejercicio inválido",
        goal: "GENERAL_HEALTH",
        level: "BEGINNER",
        timerDefaults: {},
        blocks: [
          {
            type: "MAIN",
            grouping: "STRAIGHT",
            rounds: 1,
            items: [{ exercise: { ref: "custom", name: "X", mode: "REPS", muscleGroups: [] }, sets: 1, targetReps: 10 }],
          },
        ],
      },
    });

    const result = fitRoutineFileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rechaza un archivo cuyo tamaño no importa aquí pero cuya forma general no es un objeto", () => {
    const result = fitRoutineFileSchema.safeParse("no soy un objeto");
    expect(result.success).toBe(false);
  });
});
