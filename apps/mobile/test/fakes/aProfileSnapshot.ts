import { asId } from "@/shared/domain/Id";
import type { ProfileSnapshot } from "@/features/catalog/application/ports";

/**
 * Builder de `ProfileSnapshot`, el DTO de solo lectura que F01 pasará a
 * `generateProposal` (`specs/F02-catalogo-propuesta/plan.md` §1: "F02 solo
 * recibe un `ProfileSnapshot` ... sin importar nada de `features/profile`").
 * Por defecto reproduce el perfil de CA-02.04.1.
 */
export function aProfileSnapshot(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
  return {
    profileId: asId("00000000-0000-4000-b000-000000000001"),
    goal: "MUSCLE_GAIN",
    level: "INTERMEDIATE",
    daysPerWeek: 4,
    minutesPerSession: 60,
    equipment: ["DUMBBELLS", "PULL_UP_BAR"],
    parqFlagged: false,
    ...overrides,
  };
}
