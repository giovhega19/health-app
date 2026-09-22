/**
 * Value object de duración (segundos enteros, no negativos). Placeholder
 * fundacional (H0): lo usan features como `workout-session` (F05) para el
 * motor de temporizador; las reglas específicas (RN-*) se agregan en su
 * plan técnico.
 */
export class Duration {
  private readonly seconds: number;

  private constructor(seconds: number) {
    this.seconds = seconds;
  }

  static fromSeconds(seconds: number): Duration {
    if (!Number.isInteger(seconds) || seconds < 0) {
      throw new Error("Duration debe ser un número entero de segundos >= 0.");
    }
    return new Duration(seconds);
  }

  toSeconds(): number {
    return this.seconds;
  }

  equals(other: Duration): boolean {
    return this.seconds === other.seconds;
  }
}
