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

/**
 * `AccountDeletedEvent` (CA-01.08.1, hallazgo de seguridad H2 "Eliminar
 * cuenta no purga datos locales de rutinas/horarios ni cancela
 * notificaciones"). `DeleteAccount.execute()` lo publica tras limpiar sus
 * propios datos (perfil/peso/tokens); `composition/container.ts` se
 * suscribe para purgar `routines`/`scheduling` sin que `profile` importe
 * los internos de esas features (Art. 2.5/9.2) — mismo patrón que el
 * backend (`training`'s `AccountDeletedListener` escuchando el evento de
 * borrado de `identity`).
 */
export interface AccountDeletedEvent extends DomainEvent {
  type: "AccountDeleted";
}
