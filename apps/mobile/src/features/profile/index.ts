/**
 * API pública del módulo "profile" (F01). Ningún otro módulo debe importar
 * los internos de `profile` (domain/, application/, infrastructure/,
 * presentation/): solo este archivo (Art. 2.5 de la constitución).
 *
 * `createProfileContainer` es lo que `src/composition/container.ts` usa para
 * cablear los casos de uso reales con sus adaptadores de infraestructura
 * (`specs/F01-perfil-onboarding/plan.md` §1 "punto de integración único").
 */
import { CompleteOnboarding } from "./application/CompleteOnboarding";
import { CreateAccount } from "./application/CreateAccount";
import { ContinueAsGuest } from "./application/ContinueAsGuest";
import { DeleteAccount } from "./application/DeleteAccount";
import { LogBodyWeight } from "./application/LogBodyWeight";
import { LoginUser } from "./application/LoginUser";
import { UpdateProfile } from "./application/UpdateProfile";
import { GetCurrentProfile } from "./application/GetCurrentProfile";
import type {
  AuthPort,
  BodyMetricRepository,
  ProfileRepository,
  RemoteProfilePort,
  RoutineProposalPort,
  TokenStoragePort,
} from "./application/ports";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";

export type {
  AuthPort,
  AuthSession,
  BodyMetricRepository,
  ProfileRepository,
  ProfileSnapshot,
  RemoteProfilePort,
  RepositoryError,
  RoutineProposalPort,
  TokenStoragePort,
} from "./application/ports";
export type { UserProfile } from "./domain/UserProfile";
export type { BodyMetric } from "./domain/BodyMetric";

export interface ProfileDeps {
  profileRepository: ProfileRepository;
  bodyMetricRepository: BodyMetricRepository;
  authPort: AuthPort;
  tokenStoragePort: TokenStoragePort;
  routineProposalPort: RoutineProposalPort;
  remoteProfilePort: RemoteProfilePort;
  eventBus: EventBus;
  clock: Clock;
}

export function createProfileContainer(deps: ProfileDeps): {
  completeOnboarding: CompleteOnboarding;
  createAccount: CreateAccount;
  continueAsGuest: ContinueAsGuest;
  deleteAccount: DeleteAccount;
  logBodyWeight: LogBodyWeight;
  loginUser: LoginUser;
  updateProfile: UpdateProfile;
  getCurrentProfile: GetCurrentProfile;
} {
  return {
    completeOnboarding: new CompleteOnboarding({
      profileRepository: deps.profileRepository,
      bodyMetricRepository: deps.bodyMetricRepository,
      routineProposalPort: deps.routineProposalPort,
      eventBus: deps.eventBus,
      clock: deps.clock,
    }),
    createAccount: new CreateAccount({
      authPort: deps.authPort,
      profileRepository: deps.profileRepository,
      tokenStoragePort: deps.tokenStoragePort,
      eventBus: deps.eventBus,
      clock: deps.clock,
    }),
    continueAsGuest: new ContinueAsGuest({
      profileRepository: deps.profileRepository,
      eventBus: deps.eventBus,
      clock: deps.clock,
    }),
    deleteAccount: new DeleteAccount({
      authPort: deps.authPort,
      profileRepository: deps.profileRepository,
      bodyMetricRepository: deps.bodyMetricRepository,
      tokenStoragePort: deps.tokenStoragePort,
      eventBus: deps.eventBus,
      clock: deps.clock,
    }),
    logBodyWeight: new LogBodyWeight({
      bodyMetricRepository: deps.bodyMetricRepository,
      profileRepository: deps.profileRepository,
      eventBus: deps.eventBus,
      clock: deps.clock,
    }),
    loginUser: new LoginUser({
      authPort: deps.authPort,
      tokenStoragePort: deps.tokenStoragePort,
    }),
    updateProfile: new UpdateProfile({
      profileRepository: deps.profileRepository,
      remoteProfilePort: deps.remoteProfilePort,
      eventBus: deps.eventBus,
      clock: deps.clock,
    }),
    getCurrentProfile: new GetCurrentProfile(deps.profileRepository),
  };
}
