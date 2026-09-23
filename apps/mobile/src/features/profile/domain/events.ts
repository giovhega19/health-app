import type { DomainEvent } from "@/shared/domain/EventBus";
import type { Id } from "@/shared/domain/Id";

/**
 * Eventos de dominio de `profile` (F01), `specs/F01-perfil-onboarding/spec.md`
 * "Eventos" y `plan.md` §3.
 */
export interface ProfileUpdatedEvent extends DomainEvent {
  type: "ProfileUpdated";
  profileId: Id;
  updatedAt: Date;
}

export interface BodyWeightLoggedEvent extends DomainEvent {
  type: "BodyWeightLogged";
  profileId: Id;
  weightKg: number;
  date: Date;
}

export type OnboardingMode = "GUEST" | "ACCOUNT";

export interface OnboardingCompletedEvent extends DomainEvent {
  type: "OnboardingCompleted";
  profileId: Id;
  mode: OnboardingMode;
}
