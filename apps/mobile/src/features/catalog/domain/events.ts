import type { DomainEvent } from "@/shared/domain/EventBus";
import type { Id } from "@/shared/domain/Id";
import type { WeeklyPlan } from "./WeeklyPlan";

/**
 * Eventos de dominio de `catalog` (F02), `specs/F02-catalogo-propuesta/plan.md`
 * §3. En H1 `ProposalAccepted` no tiene suscriptores todavía (F03/F04 los
 * añaden en H2 sin modificar `catalog`, Art. 9.1/9.2).
 */
export interface PreferredScheduleEntry {
  dayNumber: number;
  preferredTime: string;
}

export interface ProposalAcceptedEvent extends DomainEvent {
  type: "ProposalAccepted";
  profileId: Id;
  plan: WeeklyPlan;
  preferredSchedule: PreferredScheduleEntry[];
}

export interface CatalogUpdatedEvent extends DomainEvent {
  type: "CatalogUpdated";
  version: number;
  exercisesCount: number;
  routinesCount: number;
}
