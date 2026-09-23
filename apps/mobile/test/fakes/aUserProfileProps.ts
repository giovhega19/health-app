import type { UserProfileProps } from "@/features/profile/domain/UserProfile";

/**
 * Builder de `UserProfileProps` (07-estrategia-pruebas.md §2.6: "Datos de
 * prueba con builders"). Por defecto reproduce el perfil de referencia de
 * CA-01.05.1 (`specs/F01-perfil-onboarding/spec.md`): 30 años, FEMALE,
 * 165 cm, consentimiento de salud ya otorgado (Art. 5.3).
 */
export function aUserProfileProps(overrides: Partial<UserProfileProps> = {}): UserProfileProps {
  return {
    // 1996-01-15 -> 30 años cumplidos el 2026-09-22 (fecha "hoy" usada en las
    // pruebas de este paquete, ver FakeClock en cada archivo de prueba).
    birthDate: new Date("1996-01-15T00:00:00Z"),
    gender: "FEMALE",
    heightCm: 165,
    goal: "GENERAL_HEALTH",
    level: "BEGINNER",
    daysPerWeek: 3,
    minutesPerSession: 30,
    equipment: ["NONE"],
    unitSystem: "METRIC",
    targetWeightKg: null,
    parqFlagged: false,
    healthConsentAt: new Date("2026-09-22T10:00:00Z"),
    ...overrides,
  };
}
