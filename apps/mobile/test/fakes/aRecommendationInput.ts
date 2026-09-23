import type { RecommendationInput } from "@/features/catalog/domain/RecommendationEngine";

/**
 * Builder de datos (07-estrategia-pruebas.md §2.6: "Datos de prueba con
 * builders"). Por defecto reproduce exactamente el perfil de CA-02.04.1
 * (`spec.md`): MUSCLE_GAIN, INTERMEDIATE, 4 días, 60 min, equipo
 * [DUMBBELLS, PULL_UP_BAR].
 */
export function aRecommendationInput(
  overrides: Partial<RecommendationInput> = {},
): RecommendationInput {
  return {
    goal: "MUSCLE_GAIN",
    level: "INTERMEDIATE",
    daysPerWeek: 4,
    minutesPerSession: 60,
    equipment: ["DUMBBELLS", "PULL_UP_BAR"],
    parqFlagged: false,
    ...overrides,
  };
}
