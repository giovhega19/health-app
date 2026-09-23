import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { WeeklyPlan } from "../domain/WeeklyPlan";
import type { PreferredScheduleEntry, ProposalAcceptedEvent } from "../domain/events";

/**
 * `AcceptProposal` (CA-02.04.3, tarea `F02-T13`). Alcance en H1
 * (`specs/F02-catalogo-propuesta/plan.md` §2 "Alcance de `AcceptProposal` en
 * H1", confirmado por el dueño de producto): solo valida/ajusta el plan en
 * memoria y emite `ProposalAccepted`. NO escribe en "Mis rutinas" ni crea
 * `ScheduleSlot` (esas tablas no existen hasta F03/F04, H2).
 */
export interface AcceptProposalInput {
  profileId: Id;
  plan: WeeklyPlan;
  preferredSchedule: PreferredScheduleEntry[];
}

export class AcceptProposal {
  constructor(
    private readonly eventBus: EventBus,
    private readonly clock: Clock,
  ) {}

  async execute(input: AcceptProposalInput): Promise<Result<void, never>> {
    const event: ProposalAcceptedEvent = {
      type: "ProposalAccepted",
      occurredAt: this.clock.now(),
      profileId: input.profileId,
      plan: input.plan,
      preferredSchedule: input.preferredSchedule,
    };

    await this.eventBus.publish(event);

    return ok(undefined);
  }
}
