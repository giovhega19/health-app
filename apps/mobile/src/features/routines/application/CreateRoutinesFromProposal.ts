import { isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { generateId } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { ProposalAcceptedEvent } from "@/features/catalog";
import { Routine } from "../domain/Routine";
import type { RoutineFromProposalRef, RoutinesCreatedFromProposalEvent } from "../domain/events";
import type { RepositoryError } from "../domain/errors";
import type { RoutineRepository } from "./ports";

const DEFAULT_PREFERRED_TIME = "08:00";

/**
 * `CreateRoutinesFromProposal` (CA-02.04.3, cierre — tarea `F03-T13`,
 * `specs/F03-editor-rutinas/plan.md` §1/§3): suscriptor de `ProposalAccepted`
 * (emitido por `catalog`, F02). Por cada día del plan aceptado, crea una
 * `Routine` (source=USER) en "Mis rutinas" y emite `RoutinesCreatedFromProposal`,
 * que F04 (`CreateScheduleSlotsFromProposal`) consume para crear los
 * `ScheduleSlot` correspondientes. Acoplamiento por evento, nunca por import
 * directo de internos de `catalog` (Art. 2.5/9.2) — solo se importa el tipo
 * público `ProposalAcceptedEvent` re-exportado por `features/catalog/index.ts`.
 *
 * `WeeklyPlanDay` no lleva `goal`/`level` propios (son del perfil, no del
 * plan); como el evento tampoco los transporta (Art. 2.5: `catalog` no debe
 * ampliarse para esto en H2), se usan valores genéricos por defecto
 * (`GENERAL_HEALTH`/`BEGINNER`) — el usuario puede editarlos después desde
 * el editor de rutinas, igual que cualquier otra rutina propia.
 */
export class CreateRoutinesFromProposal {
  constructor(
    private readonly repository: RoutineRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock,
    private readonly appTimerDefaults: TimerSettings,
  ) {}

  async execute(event: ProposalAcceptedEvent): Promise<Result<RoutinesCreatedFromProposalEvent, RepositoryError>> {
    const refs: RoutineFromProposalRef[] = [];

    for (const day of event.plan.days) {
      const created = Routine.create({
        id: generateId(this.clock),
        name: `Día ${day.dayNumber}`,
        description: null,
        goal: "GENERAL_HEALTH",
        level: "BEGINNER",
        source: "USER",
        timerDefaults: { ...this.appTimerDefaults, ...day.routine.timerDefaults },
        blocks: day.routine.blocks,
        version: 1,
        updatedAt: this.clock.now(),
        deletedAt: null,
      });
      if (!isOk(created)) {
        // Un día del plan que no cumple RN-06 (no debería ocurrir: el plan ya
        // pasó por `RecommendationEngine`, que respeta esos límites) se
        // omite en vez de abortar el resto del plan aceptado.
        continue;
      }

      const saveResult = await this.repository.save(created.value);
      if (!isOk(saveResult)) {
        return saveResult;
      }

      const preferredTime =
        event.preferredSchedule.find((entry) => entry.dayNumber === day.dayNumber)?.preferredTime ??
        DEFAULT_PREFERRED_TIME;

      refs.push({ routineId: created.value.id, dayNumber: day.dayNumber, preferredTime });
    }

    const resultEvent: RoutinesCreatedFromProposalEvent = {
      type: "RoutinesCreatedFromProposal",
      occurredAt: this.clock.now(),
      routines: refs,
    };
    await this.eventBus.publish(resultEvent);

    return ok(resultEvent);
  }
}
