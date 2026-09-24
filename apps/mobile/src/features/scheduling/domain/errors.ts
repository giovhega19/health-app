/**
 * Errores de dominio de `scheduling` (F04), `05-modelo-dominio-reglas.md`
 * RN-13/RN-15/RN-16 y `specs/F04-programacion-recordatorios/spec.md`. Se
 * usan dentro de `Result<T, E>` (Art. 2.3), nunca lanzados salvo en la
 * validación de un value object (mismo patrón que
 * `features/profile/domain/errors.ts`).
 */
export class NoDaysSelectedError extends Error {
  readonly code = "NO_DAYS_SELECTED";

  constructor(message = "Selecciona al menos un día de la semana.") {
    super(message);
    this.name = "NoDaysSelectedError";
  }
}

export class InvalidStartTimeError extends Error {
  readonly code = "INVALID_START_TIME";

  constructor(message = "La hora de inicio debe tener el formato HH:mm.") {
    super(message);
    this.name = "InvalidStartTimeError";
  }
}

export class InvalidReminderOffsetError extends Error {
  readonly code = "INVALID_REMINDER_OFFSET";

  constructor(message = "El aviso previo no puede ser negativo.") {
    super(message);
    this.name = "InvalidReminderOffsetError";
  }
}

export class PostponeLimitReachedError extends Error {
  readonly code = "POSTPONE_LIMIT_REACHED";

  constructor(message = "Ya se pospuso esta rutina 3 veces hoy.") {
    super(message);
    this.name = "PostponeLimitReachedError";
  }
}
