import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";

/**
 * RN-06 Límites de validación (`05-modelo-dominio-reglas.md` §2), F03-T05.
 * Las constantes son la tabla real de la RN; `validateAgainstLimits` (modo
 * estricto, CA-03.01.2) rechaza valores fuera de rango; `clampToLimits`
 * (modo laxo, CA-03.08.3) los recorta al límite más cercano.
 */
export const ROUTINE_LIMITS = {
  sets: { min: 1, max: 10, step: 1 },
  reps: { min: 1, max: 100, step: 1 },
  workSeconds: { min: 5, max: 600, step: 5 },
  restSeconds: { min: 0, max: 600, step: 5 },
  prepSeconds: { min: 0, max: 30, step: 1 },
  rounds: { min: 1, max: 10, step: 1 },
  weightKg: { min: 0, max: 500, step: 0.5 },
  itemsPerRoutine: { min: 1, max: 40, step: 1 },
} as const;

export type RoutineLimitField = keyof typeof ROUTINE_LIMITS;

export interface RoutineLimitError {
  kind: "OUT_OF_RANGE";
  field: RoutineLimitField;
  value: number;
  min: number;
  max: number;
}

/**
 * RN-06: rechaza valores fuera de rango. Usado por `Routine.create`/
 * `addItem`/`setOverrides` (modo "estricto", CA-03.01.2).
 */
export function validateAgainstLimits(
  field: RoutineLimitField,
  value: number,
): Result<number, RoutineLimitError> {
  const { min, max } = ROUTINE_LIMITS[field];
  if (value < min || value > max) {
    return err({ kind: "OUT_OF_RANGE", field, value, min, max });
  }
  return ok(value);
}

/**
 * RN-06: recorta valores fuera de rango en vez de rechazarlos. Usado por
 * `PreviewImportRoutine` (modo "laxo", CA-03.08.3: reps=500 → 100).
 */
export function clampToLimits(
  field: RoutineLimitField,
  value: number,
): { value: number; clamped: boolean } {
  const { min, max } = ROUTINE_LIMITS[field];
  if (value < min) {
    return { value: min, clamped: true };
  }
  if (value > max) {
    return { value: max, clamped: true };
  }
  return { value, clamped: false };
}
