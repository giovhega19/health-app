import type { DomainEvent } from "@/shared/domain/EventBus";
import type { Id } from "@/shared/domain/Id";
import type { DayOfWeek } from "./ScheduleSlot";

/**
 * Eventos de dominio de `scheduling` (F04),
 * `specs/F04-programacion-recordatorios/plan.md` §3 "Eventos de dominio".
 */
export interface RoutineScheduledEvent extends DomainEvent {
  type: "RoutineScheduled";
  scheduleSlotId: Id;
  routineId: Id;
  daysOfWeek: DayOfWeek[];
  startTime: string;
}

export interface SlotCancelledEvent extends DomainEvent {
  type: "SlotCancelled";
  scheduleSlotId: Id;
}

export interface NotificationPostponedEvent extends DomainEvent {
  type: "NotificationPostponed";
  scheduleSlotId: Id;
  newFireAt: Date;
  postponeCountToday: number;
}
