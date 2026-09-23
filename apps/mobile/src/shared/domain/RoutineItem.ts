import type { Id } from "./Id";
import type { TimerSettings } from "./TimerSettings";

/**
 * Forma estructural compartida (sin identidad propia), F02-T03
 * (`specs/F02-catalogo-propuesta/plan.md` §2 "Decisión de diseño"):
 * `05-modelo-dominio-reglas.md` §1 (class RoutineItem).
 */
export interface RoutineItem {
  id: Id;
  exerciseId: Id;
  sets: number;
  targetReps?: number;
  targetSeconds?: number;
  weightKg?: number;
  timerOverrides?: TimerSettings;
}
