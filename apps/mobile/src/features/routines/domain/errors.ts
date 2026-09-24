import type { RoutineLimitField } from "./RoutineLimits";

/**
 * Errores de dominio de `routines` (F03), expresados como `Result.err(...)`
 * en vez de excepciones (Art. 2.3 de la constitución).
 */
export type RoutineValidationError =
  | { kind: "NAME_REQUIRED" }
  | { kind: "NO_ITEMS" }
  | { kind: "OUT_OF_RANGE"; field: RoutineLimitField; value: number; min: number; max: number }
  | { kind: "ITEM_MODE_MISMATCH"; itemId: string; mode: "REPS" | "TIME" }
  | { kind: "BLOCK_NOT_FOUND"; blockId: string }
  | { kind: "ITEM_NOT_FOUND"; itemId: string }
  | { kind: "ROUTINE_PROTECTED" };

export type CustomExerciseValidationError = { kind: "NAME_REQUIRED" } | { kind: "NO_MUSCLE_GROUPS" };

export type RepositoryError = { kind: "NOT_FOUND" | "STORAGE_ERROR" | "UNKNOWN"; message?: string };

export type FileError =
  | { kind: "CANCELLED" }
  | { kind: "READ_ERROR"; message?: string }
  | { kind: "WRITE_ERROR"; message?: string }
  | { kind: "TOO_LARGE"; sizeBytes: number };

export type LookupError = { kind: "NOT_FOUND" };

export type ImportWarningKind = "UNKNOWN_EXERCISE_CONVERTED" | "VALUE_CLAMPED";

export interface ImportWarning {
  kind: ImportWarningKind;
  message: string;
  itemRef?: string;
  field?: string;
}

export type ImportError =
  | { kind: "INVALID_FORMAT"; issues: string[] }
  | { kind: "UNSUPPORTED_VERSION"; fileSchemaVersion: number; supportedSchemaVersion: number }
  | { kind: "FILE_TOO_LARGE"; sizeBytes: number; maxSizeBytes: number };
