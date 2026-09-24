/**
 * Fixtures de `.fitroutine.json` (RF-03.08, `06-contratos-api.md` §4,
 * ADR-009) para las pruebas de `fitRoutineFileSchema`, `PreviewImportRoutine`
 * y `ConfirmImportRoutine`.
 */
export function aValidFitRoutineFile(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema: "fitapp.routine",
    schemaVersion: 1,
    exportedAt: "2026-09-21T10:00:00Z",
    routine: {
      name: "Pecho y flexiones",
      goal: "MUSCLE_GAIN",
      level: "INTERMEDIATE",
      timerDefaults: { prepSeconds: 10, restBetweenSetsSeconds: 60, restBetweenExercisesSeconds: 90 },
      blocks: [
        {
          type: "MAIN",
          grouping: "STRAIGHT",
          rounds: 1,
          items: [
            { exercise: { ref: "catalog:push-up" }, sets: 4, targetReps: 12 },
            {
              exercise: { ref: "custom", name: "Flexión en toalla", mode: "REPS", muscleGroups: ["CHEST"] },
              sets: 3,
              targetReps: 10,
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

/** CA-03.08.3: referencia a un ejercicio de catálogo inexistente + reps fuera de rango. */
export function aFitRoutineFileWithProblems(): Record<string, unknown> {
  return aValidFitRoutineFile({
    routine: {
      name: "Rutina con problemas",
      goal: "GENERAL_HEALTH",
      level: "BEGINNER",
      timerDefaults: { prepSeconds: 10, restBetweenSetsSeconds: 60, restBetweenExercisesSeconds: 90 },
      blocks: [
        {
          type: "MAIN",
          grouping: "STRAIGHT",
          rounds: 1,
          items: [{ exercise: { ref: "catalog:no-existe" }, sets: 3, targetReps: 500 }],
        },
      ],
    },
  });
}

/** CA-03.08.4: schemaVersion mayor que la soportada. */
export function aFitRoutineFileWithUnsupportedVersion(): Record<string, unknown> {
  return aValidFitRoutineFile({ schemaVersion: 2 });
}
