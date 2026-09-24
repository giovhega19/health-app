import type { Id } from "@/shared/domain/Id";

/** CA-04.05.1: máximo de veces que se puede posponer una notificación por día. */
export const MAX_POSTPONES_PER_DAY = 3;

/**
 * `PostponeCounter` (VO por fecha local "YYYY-MM-DD" + `ScheduleSlot`,
 * `specs/F04-programacion-recordatorios/plan.md` §2/§4). Andamiaje
 * fundacional: la lógica de negocio bajo prueba es el caso de uso
 * `PostponeNotification` (aplicación), no este VO (trivial: contar y
 * comparar contra el máximo).
 */
export interface PostponeCounter {
  date: string;
  scheduleSlotId: Id;
  count: number;
}

export function createPostponeCounter(date: string, scheduleSlotId: Id): PostponeCounter {
  return { date, scheduleSlotId, count: 0 };
}

export function canPostpone(counter: PostponeCounter): boolean {
  return counter.count < MAX_POSTPONES_PER_DAY;
}

export function incrementPostponeCounter(counter: PostponeCounter): PostponeCounter {
  return { ...counter, count: counter.count + 1 };
}
