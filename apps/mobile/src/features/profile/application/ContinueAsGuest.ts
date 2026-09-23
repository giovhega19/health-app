import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { UserProfile } from "../domain/UserProfile";
import type { OnboardingCompletedEvent } from "../domain/events";
import type { ProfileRepository, RepositoryError } from "./ports";

/**
 * `ContinueAsGuest` (RF-01.02, tarea `F01-T12`). `CompleteOnboarding` ya creó
 * el perfil local (sin cuenta); este caso de uso solo confirma el modo
 * invitado y publica `OnboardingCompleted`, sin tocar ningún `AuthPort`
 * (`specs/F01-perfil-onboarding/plan.md` §1).
 */
export interface ContinueAsGuestDeps {
  profileRepository: ProfileRepository;
  eventBus: EventBus;
  clock: Clock;
}

export interface ContinueAsGuestResult {
  profile: UserProfile;
}

export type ContinueAsGuestError = RepositoryError | { kind: "NO_PROFILE" };

export class ContinueAsGuest {
  constructor(private readonly deps: ContinueAsGuestDeps) {}

  async execute(): Promise<Result<ContinueAsGuestResult, ContinueAsGuestError>> {
    const currentResult = await this.deps.profileRepository.findCurrent();
    if (!currentResult.ok) {
      return currentResult;
    }
    if (!currentResult.value) {
      return err({ kind: "NO_PROFILE" });
    }
    const profile = currentResult.value;

    const event: OnboardingCompletedEvent = {
      type: "OnboardingCompleted",
      occurredAt: this.deps.clock.now(),
      profileId: profile.id,
      mode: "GUEST",
    };
    await this.deps.eventBus.publish(event);

    return ok({ profile });
  }
}
