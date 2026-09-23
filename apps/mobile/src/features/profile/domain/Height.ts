import { InvalidHeightError } from "./errors";

/**
 * `Height` (CA-01.03.2, RF-01.03): value object con conversión de unidades
 * ft/in <-> cm y validación de rango (100-250 cm, tabla "Validaciones" de
 * `spec.md`). Value object exclusivo de `profile/domain`
 * (`specs/F01-perfil-onboarding/plan.md` §1 "Decisión de diseño"): ninguna
 * otra feature planificada lo necesita todavía.
 */
const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;
const MIN_CM = 100;
const MAX_CM = 250;

export class Height {
  private constructor(private readonly cm: number) {}

  static fromCm(cm: number): Height {
    if (!Number.isFinite(cm) || cm < MIN_CM || cm > MAX_CM) {
      throw new InvalidHeightError();
    }
    return new Height(cm);
  }

  static fromFeetInches(feet: number, inches: number): Height {
    const totalInches = feet * INCHES_PER_FOOT + inches;
    return Height.fromCm(totalInches * CM_PER_INCH);
  }

  toCm(): number {
    return this.cm;
  }

  toFeetInches(): { feet: number; inches: number } {
    const totalInches = this.cm / CM_PER_INCH;
    const feet = Math.floor(totalInches / INCHES_PER_FOOT);
    const inches = Math.round(totalInches - feet * INCHES_PER_FOOT);
    if (inches === INCHES_PER_FOOT) {
      return { feet: feet + 1, inches: 0 };
    }
    return { feet, inches };
  }
}
