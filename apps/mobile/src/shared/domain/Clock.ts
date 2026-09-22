/**
 * Puerto de reloj (Art. 2.4 de la constitución, 04-arquitectura.md §3.1):
 * el dominio y la aplicación nunca leen la hora con
 * `Date.now()`/`new Date()` directamente, sino a través de esta interfaz,
 * para que el tiempo sea determinista y sustituible en las pruebas
 * (p. ej. `workout-session/domain/TimerEngine.ts`, ver ADR-005).
 */
export interface Clock {
  now(): Date;
}
