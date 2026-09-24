import type { Id } from "./Id";
import type { TimerSettings } from "./TimerSettings";

/**
 * Forma estructural compartida (sin identidad propia), F02-T03
 * (`specs/F02-catalogo-propuesta/plan.md` §2 "Decisión de diseño"):
 * `05-modelo-dominio-reglas.md` §1 (class RoutineItem).
 *
 * `exerciseSource` (campo opcional y aditivo, F03,
 * `specs/F03-editor-rutinas/plan.md` §1 "Decisión de diseño: ejercicios
 * personalizados"): distingue si `exerciseId` referencia un `Exercise` de
 * `catalog` o un `CustomExercise` de `routines`. Ausente ⇒ `"CATALOG"`,
 * compatible con todo lo que F02 ya construyó (que nunca lo setea ni lo
 * lee).
 */
export interface RoutineItem {
  id: Id;
  exerciseId: Id;
  sets: number;
  targetReps?: number;
  targetSeconds?: number;
  weightKg?: number;
  timerOverrides?: TimerSettings;
  exerciseSource?: "CATALOG" | "CUSTOM";
}
