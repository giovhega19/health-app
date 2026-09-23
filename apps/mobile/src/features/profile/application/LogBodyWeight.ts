import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { generateId } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import { BodyMetric } from "../domain/BodyMetric";
import { validateBodyWeightKg } from "../domain/BodyWeight";
import type { InvalidWeightError } from "../domain/errors";
import type { BodyWeightLoggedEvent } from "../domain/events";
import type { BodyMetricRepository, ProfileRepository, RepositoryError } from "./ports";

/**
 * `LogBodyWeight` (RF-01.06, tarea `F01-T11`). CA-01.06.1: registra el peso
 * del día (upsert por fecha vía `BodyMetricRepository.append`, ver su
 * comentario) y emite `BodyWeightLogged`.
 */
export interface LogBodyWeightCommand {
  weightKg: number;
  date: Date;
}

export type LogBodyWeightError = InvalidWeightError | RepositoryError | { kind: "NO_PROFILE" };

export interface LogBodyWeightDeps {
  bodyMetricRepository: BodyMetricRepository;
  profileRepository: ProfileRepository;
  eventBus: EventBus;
  clock: Clock;
}

export class LogBodyWeight {
  constructor(private readonly deps: LogBodyWeightDeps) {}

  async execute(command: LogBodyWeightCommand): Promise<Result<void, LogBodyWeightError>> {
    const validated = validateBodyWeightKg(command.weightKg);
    if (!validated.ok) {
      return validated;
    }

    const currentResult = await this.deps.profileRepository.findCurrent();
    if (!currentResult.ok) {
      return currentResult;
    }
    if (!currentResult.value) {
      return err({ kind: "NO_PROFILE" });
    }
    const profile = currentResult.value;

    const metric = BodyMetric.create({
      id: generateId(this.deps.clock),
      profileId: profile.id,
      date: command.date,
      weightKg: validated.value,
      waistCm: null,
    });

    const appendResult = await this.deps.bodyMetricRepository.append(metric);
    if (!appendResult.ok) {
      return appendResult;
    }

    const event: BodyWeightLoggedEvent = {
      type: "BodyWeightLogged",
      occurredAt: this.deps.clock.now(),
      profileId: profile.id,
      weightKg: validated.value,
      date: command.date,
    };
    await this.deps.eventBus.publish(event);

    return ok(undefined);
  }
}
