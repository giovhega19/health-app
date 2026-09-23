import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { UserProfile } from "../domain/UserProfile";
import type { OnboardingCompletedEvent } from "../domain/events";
import type { AuthError, AuthPort, ProfileRepository, RegisterInput, RepositoryError, TokenStoragePort } from "./ports";

/**
 * `CreateAccount` (RF-01.01, tarea `F01-T12`). CA-01.01.1 "Pasar de invitado
 * a cuenta sin perder datos": crea la cuenta (`AuthPort.guestUpgrade`, que
 * llama a `POST /auth/guest/upgrade`), guarda los tokens y vincula el perfil
 * local YA EXISTENTE a la cuenta nueva (no lo recrea desde cero,
 * `specs/F01-perfil-onboarding/plan.md` §5).
 */
export interface CreateAccountCommand {
  email: string;
  password: string;
  acceptedTermsVersion: string;
}

export interface CreateAccountResult {
  profile: UserProfile;
}

export type CreateAccountError = AuthError | RepositoryError | { kind: "NO_PROFILE" };

export interface CreateAccountDeps {
  authPort: AuthPort;
  profileRepository: ProfileRepository;
  tokenStoragePort: TokenStoragePort;
  eventBus: EventBus;
  clock: Clock;
}

export class CreateAccount {
  constructor(private readonly deps: CreateAccountDeps) {}

  async execute(command: CreateAccountCommand): Promise<Result<CreateAccountResult, CreateAccountError>> {
    const registerInput: RegisterInput = {
      email: command.email,
      password: command.password,
      acceptedTermsVersion: command.acceptedTermsVersion,
    };

    const sessionResult = await this.deps.authPort.guestUpgrade(registerInput);
    if (!sessionResult.ok) {
      return sessionResult;
    }
    const session = sessionResult.value;

    const currentResult = await this.deps.profileRepository.findCurrent();
    if (!currentResult.ok) {
      return currentResult;
    }
    if (!currentResult.value) {
      return err({ kind: "NO_PROFILE" });
    }

    const linkedProfile = currentResult.value.withAccountId(session.user.id);
    const saveResult = await this.deps.profileRepository.save(linkedProfile);
    if (!saveResult.ok) {
      return saveResult;
    }

    const storageResult = await this.deps.tokenStoragePort.save(session);
    if (!storageResult.ok) {
      return storageResult;
    }

    const event: OnboardingCompletedEvent = {
      type: "OnboardingCompleted",
      occurredAt: this.deps.clock.now(),
      profileId: linkedProfile.id,
      mode: "ACCOUNT",
    };
    await this.deps.eventBus.publish(event);

    return ok({ profile: linkedProfile });
  }
}
