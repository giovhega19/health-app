import { z } from "zod";

/**
 * Validador zod de `.fitroutine.json` (RF-03.08, ADR-009). Fuente normativa
 * del formato: `06-contratos-api.md` §4. Valida la **forma estructural** del
 * archivo (campos presentes, tipos correctos) — deliberadamente NO aplica
 * aquí los límites numéricos de RN-06 (eso lo hace `clampToLimits` en
 * `PreviewImportRoutine`, con advertencia, CA-03.08.3) ni rechaza versiones
 * futuras de `schemaVersion` (eso lo hace `PreviewImportRoutine` con el
 * mensaje amigable de CA-03.08.4, no un error de parseo genérico de zod).
 *
 * `packages/routine-schema/fitroutine.schema.v1.json` (JSON Schema draft
 * 2020-12) es la fuente canónica y portable del mismo contrato; una prueba
 * de paridad (`packages/routine-schema/__tests__/parity.test.ts`, tarea
 * `F03-T08`, fuera del alcance de esta ronda de `qa-pruebas`) debe mantener
 * ambos sincronizados.
 */
export const SUPPORTED_SCHEMA_VERSION = 1;
export const MAX_FILE_SIZE_BYTES = 256 * 1024;

const timerSettingsPartialSchema = z
  .object({
    prepSeconds: z.number().optional(),
    workSeconds: z.number().optional(),
    restBetweenSetsSeconds: z.number().optional(),
    restBetweenExercisesSeconds: z.number().optional(),
    restBetweenRoundsSeconds: z.number().optional(),
    halfwayCue: z.boolean().optional(),
  })
  .partial();

const catalogExerciseRefSchema = z.object({
  ref: z.string().regex(/^catalog:.+/, "las referencias de catálogo deben tener el formato catalog:<id>"),
});

const customExerciseRefSchema = z.object({
  ref: z.literal("custom"),
  name: z.string().min(1),
  mode: z.enum(["REPS", "TIME"]),
  muscleGroups: z.array(z.string()).min(1),
});

export const exerciseRefSchema = z.union([catalogExerciseRefSchema, customExerciseRefSchema]);

export const fitRoutineItemSchema = z.object({
  exercise: exerciseRefSchema,
  sets: z.number().int(),
  targetReps: z.number().int().optional(),
  targetSeconds: z.number().optional(),
  weightKg: z.number().optional(),
  timerOverrides: timerSettingsPartialSchema.optional(),
});

export const fitRoutineBlockSchema = z.object({
  type: z.enum(["WARMUP", "MAIN", "COOLDOWN"]),
  grouping: z.enum(["STRAIGHT", "SUPERSET", "CIRCUIT"]),
  rounds: z.number().int().min(1),
  items: z.array(fitRoutineItemSchema).min(1),
});

export const fitRoutineFileSchema = z.object({
  schema: z.literal("fitapp.routine"),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  routine: z.object({
    name: z.string().min(1),
    goal: z.enum(["LOSE_WEIGHT", "ENDURANCE", "MUSCLE_GAIN", "STRENGTH", "GENERAL_HEALTH"]),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
    timerDefaults: timerSettingsPartialSchema,
    blocks: z.array(fitRoutineBlockSchema).min(1),
  }),
});

export type FitRoutineFile = z.infer<typeof fitRoutineFileSchema>;
export type FitRoutineItem = z.infer<typeof fitRoutineItemSchema>;
