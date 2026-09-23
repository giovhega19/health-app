/**
 * Forma estructural compartida (sin identidad propia), F02-T03
 * (`specs/F02-catalogo-propuesta/plan.md` §2 "Decisión de diseño"):
 * `05-modelo-dominio-reglas.md` §1 (class TimerSettings), RN-05.
 */
export interface TimerSettings {
  prepSeconds: number;
  workSeconds: number;
  restBetweenSetsSeconds: number;
  restBetweenExercisesSeconds: number;
  restBetweenRoundsSeconds: number;
  halfwayCue: boolean;
}
