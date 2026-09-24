import { PredefinedRoutine } from "@/features/catalog/domain/PredefinedRoutine";
import type { PredefinedRoutineCreateInput } from "@/features/catalog/domain/PredefinedRoutine";
import { DEFAULT_TIMER_DEFAULTS, anItem, nextTestId } from "./aRoutine";

/**
 * Builder de prueba para `PredefinedRoutine` (CA-03.05.1 "Duplicar y
 * editar"). Vive en `test/fakes` (fuera del alcance de `arch:check`,
 * `package.json`'s `arch:check` solo analiza `src`/`app`) precisamente para
 * que las pruebas de otras features (p. ej. `routines/presentation`) puedan
 * construir un `PredefinedRoutine` de prueba sin importar los internos de
 * `catalog` (Art. 2.5) desde `src`.
 */
export function aPredefinedRoutine(overrides: Partial<PredefinedRoutineCreateInput> = {}): PredefinedRoutine {
  return PredefinedRoutine.create({
    id: nextTestId(),
    name: "Cuerpo completo sin equipo",
    goal: "GENERAL_HEALTH",
    level: "BEGINNER",
    timerDefaults: DEFAULT_TIMER_DEFAULTS,
    blocks: [{ id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [anItem()] }],
    version: 1,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  });
}
