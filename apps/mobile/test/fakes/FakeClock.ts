import type { Clock } from "@/shared/domain/Clock";

/**
 * `Clock` determinista para pruebas (07-estrategia-pruebas.md §2.2: "Nadie
 * usa `Date.now()`/`new Date()` en el dominio ... En pruebas se usan
 * `FakeClock`"). Nunca lee el reloj real; `advance` mueve el tiempo de forma
 * explícita y controlada por la prueba.
 */
export class FakeClock implements Clock {
  private currentMs: number;

  constructor(initialIso: string) {
    this.currentMs = new Date(initialIso).getTime();
    if (Number.isNaN(this.currentMs)) {
      throw new Error(`FakeClock: "${initialIso}" no es una fecha ISO válida.`);
    }
  }

  now(): Date {
    return new Date(this.currentMs);
  }

  /** Avanza el reloj `seconds` segundos y devuelve la nueva hora. */
  advanceSeconds(seconds: number): Date {
    this.currentMs += seconds * 1000;
    return this.now();
  }
}
