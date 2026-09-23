import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { Equipment } from "@/shared/domain/Equipment";
import { UserProfile } from "../domain/UserProfile";
import type { AgeBelowMinimumError } from "../domain/errors";
import type { ProfileUpdatedEvent } from "../domain/events";
import type { AuthError, ProfileRepository, RemoteProfilePort, RepositoryError } from "./ports";

/**
 * `UpdateProfile` (RF-01.03/RF-01.06, tarea `F01-T12`). Análogo a
 * `CreateAccount`/`DeleteAccount`. Lo usa la pantalla "Editar perfil"
 * (`F01-T16`); solo expone los campos que tiene sentido editar después del
 * onboarding (objetivo, nivel, disponibilidad, estatura, equipo, peso
 * objetivo) — `birthDate`/`gender`/`unitSystem`/consentimiento de salud se
 * conservan del perfil existente (no son parte de este comando; editarlos
 * excede el alcance de esta ronda, `specs/F01-perfil-onboarding/tasks.md`
 * F01-T16).
 *
 * Igual que `plan.md` §1 "Riesgo": `mutator.ts` lanza, así que
 * `RemoteProfilePort`/`HttpProfileAdapter` capturan la excepción y la
 * traducen a `Result.err`. A diferencia de `CompleteOnboarding`/
 * `LogBodyWeight` (que solo escriben local + outbox, sin llamar a la red de
 * forma síncrona, ADR-002), `UpdateProfile` sí llama primero al backend
 * (`PUT /me/profile`) y solo persiste localmente si el servidor acepta el
 * cambio — mismo orden que `DeleteAccount` (remoto autoritativo primero) y
 * requisito explícito del encargo de esta ronda ("persistir localmente tras
 * el update remoto exitoso"). `ProfileUpdated` se sigue emitiendo y
 * encolando en el outbox (`composition/container.ts`) para que `sync`
 * reconcilie el resto de dispositivos, aunque este caso de uso ya haya
 * empujado el cambio de forma síncrona.
 */
export interface UpdateProfileCommand {
  goal: FitnessGoal;
  level: Level;
  daysPerWeek: number;
  minutesPerSession: number;
  heightCm: number;
  equipment: Equipment[];
  targetWeightKg: number | null;
}

export interface UpdateProfileResult {
  profile: UserProfile;
}

export type UpdateProfileError =
  | AgeBelowMinimumError
  | AuthError
  | RepositoryError
  | { kind: "NO_PROFILE" };

export interface UpdateProfileDeps {
  profileRepository: ProfileRepository;
  remoteProfilePort: RemoteProfilePort;
  eventBus: EventBus;
  clock: Clock;
}

export class UpdateProfile {
  constructor(private readonly deps: UpdateProfileDeps) {}

  async execute(command: UpdateProfileCommand): Promise<Result<UpdateProfileResult, UpdateProfileError>> {
    const currentResult = await this.deps.profileRepository.findCurrent();
    if (!currentResult.ok) {
      return currentResult;
    }
    if (!currentResult.value) {
      return err({ kind: "NO_PROFILE" });
    }
    const current = currentResult.value;

    const updatedResult = UserProfile.create(
      current.id,
      {
        accountId: current.accountId,
        birthDate: current.birthDate,
        gender: current.gender,
        heightCm: command.heightCm,
        goal: command.goal,
        level: command.level,
        daysPerWeek: command.daysPerWeek,
        minutesPerSession: command.minutesPerSession,
        equipment: command.equipment,
        unitSystem: current.unitSystem,
        targetWeightKg: command.targetWeightKg,
        parqFlagged: current.parqFlagged,
        healthConsentAt: current.healthConsentAt,
      },
      this.deps.clock.now(),
    );
    if (!updatedResult.ok) {
      return updatedResult;
    }
    const updated = updatedResult.value;

    const remoteResult = await this.deps.remoteProfilePort.update(updated);
    if (!remoteResult.ok) {
      return remoteResult;
    }

    const saveResult = await this.deps.profileRepository.save(updated);
    if (!saveResult.ok) {
      return saveResult;
    }

    const event: ProfileUpdatedEvent = {
      type: "ProfileUpdated",
      occurredAt: this.deps.clock.now(),
      profileId: updated.id,
      updatedAt: this.deps.clock.now(),
    };
    await this.deps.eventBus.publish(event);

    return ok({ profile: updated });
  }
}
