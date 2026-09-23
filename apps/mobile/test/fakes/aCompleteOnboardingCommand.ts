import type { CompleteOnboardingCommand } from "@/features/profile/application/CompleteOnboarding";

/**
 * Builder de `CompleteOnboardingCommand` (07-estrategia-pruebas.md §2.6).
 * Por defecto reproduce un onboarding válido y completo en modo invitado,
 * sin cuestionario de aptitud positivo y con consentimiento otorgado.
 */
export function aCompleteOnboardingCommand(
  overrides: Partial<CompleteOnboardingCommand> = {},
): CompleteOnboardingCommand {
  return {
    goal: "GENERAL_HEALTH",
    level: "BEGINNER",
    daysPerWeek: 3,
    minutesPerSession: 30,
    equipment: ["NONE"],
    unitSystem: "METRIC",
    birthDate: new Date("1996-01-15T00:00:00Z"),
    gender: "FEMALE",
    heightCm: 165,
    weightKg: 60,
    fitnessQuestionnaireAnswers: [false, false, false, false],
    healthDataConsent: true,
    ...overrides,
  };
}
