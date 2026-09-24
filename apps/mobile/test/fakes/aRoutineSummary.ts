import { asId } from "@/shared/domain/Id";
import type { RoutineSummary } from "@/features/scheduling/domain/NotificationPlanner";

/**
 * Builder de `RoutineSummary` (`specs/F04-programacion-recordatorios/plan.md`
 * §1: "el resto de F04 ... se prueba con una Routine/RoutineSummary de
 * fixture (builder `aRoutineSummary()`), sin esperar a que el editor de F03
 * esté terminado"). Forma estructural del contrato de
 * `RoutineSummaryLookupPort.summarize()` (`plan.md` §3); no importa nada de
 * `features/routines` (Art. 2.5).
 */
export function aRoutineSummary(overrides: Partial<RoutineSummary> = {}): RoutineSummary {
  return {
    id: asId("00000000-0000-4000-e100-000000000001"),
    name: "Pecho y flexiones",
    estimatedDurationSeconds: 65 * 60,
    muscleGroups: ["CHEST"],
    ...overrides,
  };
}
