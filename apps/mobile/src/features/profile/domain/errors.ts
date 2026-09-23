/**
 * Errores de dominio de `profile` (F01), `05-modelo-dominio-reglas.md` §2
 * (RN-01, RN-02) y Art. 5.3 de la constitución (consentimiento de datos de
 * salud). Se usan dentro de `Result<T, E>` (Art. 2.3), nunca lanzados salvo
 * en los value objects `Height`/`BodyWeight` cuando así lo exige la prueba
 * (`throw` en la construcción de un VO inválido es un patrón aceptado para
 * invariantes de value object, distinto de la lógica de un caso de uso).
 */
export class AgeBelowMinimumError extends Error {
  readonly code = "AGE_BELOW_MINIMUM";

  constructor(message = "La app requiere una edad mínima de 16 años.") {
    super(message);
    this.name = "AgeBelowMinimumError";
  }
}

export class InvalidHeightError extends Error {
  readonly code = "INVALID_HEIGHT";

  constructor(message = "La estatura debe estar entre 100 y 250 cm.") {
    super(message);
    this.name = "InvalidHeightError";
  }
}

export class InvalidWeightError extends Error {
  readonly code = "INVALID_WEIGHT";

  constructor(message = "El peso debe estar entre 25 y 350 kg.") {
    super(message);
    this.name = "InvalidWeightError";
  }
}

export class ConsentRequiredError extends Error {
  readonly code = "CONSENT_REQUIRED";

  constructor(message = "Se requiere el consentimiento de tratamiento de datos de salud.") {
    super(message);
    this.name = "ConsentRequiredError";
  }
}
