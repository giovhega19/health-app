import type { PredefinedRoutineSnapshot } from "@/features/routines/application/ports";
import { DEFAULT_TIMER_DEFAULTS, anItem, nextTestId } from "./aRoutine";

/**
 * `PredefinedRoutineSnapshot` de prueba (CA-03.05.1 "Duplicar y editar",
 * `specs/F03-editor-rutinas/plan.md` §5: "con un `PredefinedRoutineSnapshot`
 * fake, sin importar `catalog`").
 */
export function aPredefinedRoutineSnapshot(
  overrides: Partial<PredefinedRoutineSnapshot> = {},
): PredefinedRoutineSnapshot {
  return {
    id: nextTestId(),
    name: "Cuerpo completo sin equipo",
    goal: "LOSE_WEIGHT",
    level: "BEGINNER",
    timerDefaults: DEFAULT_TIMER_DEFAULTS,
    blocks: [{ id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [anItem()] }],
    ...overrides,
  };
}
