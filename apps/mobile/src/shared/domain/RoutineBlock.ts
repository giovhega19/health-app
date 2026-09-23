import type { Id } from "./Id";
import type { RoutineItem } from "./RoutineItem";

/**
 * Forma estructural compartida (sin identidad propia), F02-T03
 * (`specs/F02-catalogo-propuesta/plan.md` §2 "Decisión de diseño"):
 * `05-modelo-dominio-reglas.md` §1 (class RoutineBlock).
 */
export type RoutineBlockType = "WARMUP" | "MAIN" | "COOLDOWN";
export type RoutineGrouping = "STRAIGHT" | "SUPERSET" | "CIRCUIT";

export interface RoutineBlock {
  id: Id;
  type: RoutineBlockType;
  grouping: RoutineGrouping;
  rounds: number;
  items: RoutineItem[];
}
