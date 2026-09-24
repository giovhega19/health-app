import type { DomainEvent } from "@/shared/domain/EventBus";
import type { Id } from "@/shared/domain/Id";
import type { ImportWarning } from "./errors";

/**
 * Eventos de dominio de `routines` (F03), `specs/F03-editor-rutinas/plan.md`
 * §3 tabla de eventos, `05-modelo-dominio-reglas.md` §1.
 */
export interface RoutineCreatedEvent extends DomainEvent {
  type: "RoutineCreated";
  routineId: Id;
  updatedAt: Date;
}

export interface RoutineUpdatedEvent extends DomainEvent {
  type: "RoutineUpdated";
  routineId: Id;
  updatedAt: Date;
}

export interface RoutineImportedEvent extends DomainEvent {
  type: "RoutineImported";
  routineId: Id;
  warnings: ImportWarning[];
}

export interface RoutineFromProposalRef {
  routineId: Id;
  dayNumber: number;
  preferredTime: string;
}

export interface RoutinesCreatedFromProposalEvent extends DomainEvent {
  type: "RoutinesCreatedFromProposal";
  routines: RoutineFromProposalRef[];
}
