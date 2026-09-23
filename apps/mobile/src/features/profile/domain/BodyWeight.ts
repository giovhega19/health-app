import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { InvalidWeightError } from "./errors";

/**
 * Conversión lb<->kg y validación de rango propia de F01 (25-350 kg, tabla
 * "Validaciones" de `spec.md`) sobre el VO `Weight` ya scaffoldeado en
 * `shared/domain/Weight.ts` (H0), `specs/F01-perfil-onboarding/plan.md` §1
 * "Decisión de diseño".
 */
const KG_PER_POUND = 0.45359237;
const MIN_KG = 25;
const MAX_KG = 350;

export function poundsToKg(pounds: number): number {
  return pounds * KG_PER_POUND;
}

export function kgToPounds(kg: number): number {
  return kg / KG_PER_POUND;
}

export function validateBodyWeightKg(kg: number): Result<number, InvalidWeightError> {
  if (!Number.isFinite(kg) || kg < MIN_KG || kg > MAX_KG) {
    return err(new InvalidWeightError());
  }
  return ok(kg);
}
