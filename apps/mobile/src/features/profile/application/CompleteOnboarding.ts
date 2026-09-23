import { err, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { generateId } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { Equipment } from "@/shared/domain/Equipment";
import type { UnitSystem } from "@/shared/domain/UnitSystem";
import type { Gender } from "@/shared/domain/Gender";
import { UserProfile } from "../domain/UserProfile";
import { BodyMetric } from "../domain/BodyMetric";
import { ConsentRequiredError } from "../domain/errors";
import type { AgeBelowMinimumError } from "../domain/errors";
import type { OnboardingCompletedEvent } from "../domain/events";
import type {
  BodyMetricRepository,
  ProfileRepository,
  ProposalError,
  RepositoryError,
  RoutineProposalPort,
  WeeklyPlanSummary,
} from "./ports";

/**
 * `CompleteOnboarding` (RF-01.02/RF-01.04, tarea `F01-T11`): valida y
 * persiste el perfil local + el primer `BodyMetric`, calcula IMC/TMB (RN-02/
 * RN-03, en la pantalla "Resumen" que los consume) y obtiene el plan semanal
 * propuesto vía `RoutineProposalPort` (F02, `specs/F01-perfil-onboarding/plan.md`
 * §1/§3). En H1, `ContinueAsGuest` solo confirma un modo ya invitado desde el
 * principio: `CompleteOnboarding` es quien crea el perfil.
 */
export interface CompleteOnboardingCommand {
  goal: FitnessGoal;
  level: Level;
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: Equipment[];
  unitSystem: UnitSystem;
  birthDate: Date;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number | null;
  fitnessQuestionnaireAnswers: boolean[];
  healthDataConsent: boolean;
}

export interface CompleteOnboardingResult {
  profile: UserProfile;
  proposal: WeeklyPlanSummary;
}

export type CompleteOnboardingError =
  | AgeBelowMinimumError
  | ConsentRequiredError
  | RepositoryError
  | ProposalError;

export interface CompleteOnboardingDeps {
  profileRepository: ProfileRepository;
  bodyMetricRepository: BodyMetricRepository;
  routineProposalPort: RoutineProposalPort;
  eventBus: EventBus;
  clock: Clock;
}

export class CompleteOnboarding {
  constructor(private readonly deps: CompleteOnboardingDeps) {}

  async execute(command: CompleteOnboardingCommand): Promise<Result<CompleteOnboardingResult, CompleteOnboardingError>> {
    if (!command.healthDataConsent) {
      return err(new ConsentRequiredError());
    }

    const today = this.deps.clock.now();
    const parqFlagged = command.fitnessQuestionnaireAnswers.some((answer) => answer);

    const profileId = generateId(this.deps.clock);
    const created = UserProfile.create(
      profileId,
      {
        birthDate: command.birthDate,
        gender: command.gender,
        heightCm: command.heightCm,
        goal: command.goal,
        level: command.level,
        daysPerWeek: command.daysPerWeek,
        minutesPerSession: command.minutesPerSession,
        equipment: command.equipment,
        unitSystem: command.unitSystem,
        targetWeightKg: command.targetWeightKg ?? null,
        parqFlagged,
        healthConsentAt: today,
      },
      today,
    );
    if (!isOk(created)) {
      return created;
    }
    const profile = created.value;

    const saveResult = await this.deps.profileRepository.save(profile);
    if (!isOk(saveResult)) {
      return saveResult;
    }

    const metric = BodyMetric.create({
      id: generateId(this.deps.clock),
      profileId: profile.id,
      date: today,
      weightKg: command.weightKg,
      waistCm: null,
    });
    const appendResult = await this.deps.bodyMetricRepository.append(metric);
    if (!isOk(appendResult)) {
      return appendResult;
    }

    const proposalResult = await this.deps.routineProposalPort.propose({
      profileId: profile.id,
      goal: profile.goal,
      level: profile.level,
      daysPerWeek: profile.daysPerWeek,
      minutesPerSession: profile.minutesPerSession,
      equipment: profile.equipment,
      parqFlagged: profile.parqFlagged,
    });
    if (!isOk(proposalResult)) {
      return proposalResult;
    }

    const event: OnboardingCompletedEvent = {
      type: "OnboardingCompleted",
      occurredAt: today,
      profileId: profile.id,
      mode: "GUEST",
    };
    await this.deps.eventBus.publish(event);

    return ok({ profile, proposal: proposalResult.value });
  }
}
