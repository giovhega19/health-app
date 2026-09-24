import type { Id } from "@/shared/domain/Id";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { DayOfWeek, ScheduleSlot } from "./ScheduleSlot";
import type { QuietHours, SchedulingPreferences } from "./SchedulingPreferences";
import type { PostponeCounter } from "./PostponeCounter";

export type NotificationType = "PRE_REMINDER" | "START" | "EXPECTED_END" | "MISSED";

/**
 * RN-16: "Los recordatorios de sesión y los avisos de intervalo durante una
 * sesión activa no cuentan" contra `maxNotificationsPerDay`, ni respetan las
 * horas de silencio (son time-critical). En el vocabulario propio de
 * `NotificationType` de F04, esos son exactamente `PRE_REMINDER`/`START`/
 * `EXPECTED_END`; `MISSED` es el único tipo no exento.
 */
export const TYPES_EXEMPT_FROM_DAILY_CAP: readonly NotificationType[] = ["PRE_REMINDER", "START", "EXPECTED_END"];

/**
 * Forma estructural del contrato de `RoutineSummaryLookupPort.summarize()`
 * (`plan.md` §3). `scheduling` nunca importa nada de `features/routines`
 * (Art. 2.5); en pruebas se construye con el builder `aRoutineSummary()`
 * (`plan.md` §1: "el resto de F04 ... se prueba con una
 * Routine/RoutineSummary de fixture ... sin esperar a que el editor de F03
 * esté terminado").
 */
export interface RoutineSummary {
  id: Id;
  name: string;
  estimatedDurationSeconds: number;
  muscleGroups: MuscleGroup[];
}

export interface PlannedNotification {
  scheduleSlotId: Id;
  routineId: Id;
  routineName: string;
  type: NotificationType;
  fireAt: Date;
}

/**
 * Sesión ya iniciada de verdad, capturada localmente (CA-04.03.1: "Dado que
 * inicio a las 18:05 ..."). Campo opcional propuesto por `qa-pruebas` para
 * poder expresar este escenario en H2 sin depender de `workout-session`
 * (F05, H3, ver `spec.md` §"Preguntas abiertas" y `plan.md` §1): un inicio
 * real de sesión que se registra localmente (p. ej. al pulsar "Iniciar" en
 * la notificación/deep link), sin necesitar el agregado `WorkoutSession`
 * completo. `F04-T06` puede renombrar/rediseñar este campo al implementar;
 * lo que importa es el comportamiento verificado por las pruebas.
 */
export interface ActiveSessionStart {
  scheduleSlotId: Id;
  actualStartAt: Date;
}

export interface NotificationPlannerInput {
  slots: ScheduleSlot[];
  routineSummaries: RoutineSummary[];
  preferences: SchedulingPreferences;
  postponeCounters: PostponeCounter[];
  /** RN-16: cuántas notificaciones no exentas ya se contaron hoy (entregadas o ya programadas en esta misma ejecución). */
  notificationsAlreadyCountedToday: number;
  now: Date;
  activeSessionStarts?: ActiveSessionStart[];
}

/** Ventana móvil de 7 días (ADR-010). */
export const PLANNING_WINDOW_DAYS = 7;
/** Límite documentado de notificaciones locales pendientes en iOS (ADR-010, "Investigación del límite real del sistema operativo"). */
export const IOS_MAX_PENDING_NOTIFICATIONS = 64;

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toMinutesOfDay(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Próxima ocurrencia (UTC) de `day` (ISO: 1=lunes...7=domingo) a `startTime`
 * ("HH:mm") a partir de `now` (inclusive): si `day` es hoy y `startTime`
 * todavía no pasó, la ocurrencia es hoy; en cualquier otro caso, es la
 * próxima vez que ese día de la semana ocurra (a lo sumo 7 días después).
 *
 * Exportada (no solo de uso interno de `planNotifications`): también la usa
 * `CreateScheduleSlotsFromProposal` (RN-13, CA-04.04.1/CA-04.04.2) para
 * ubicar en el tiempo los `ScheduleSlot` que crea a partir de una propuesta y
 * poder comparar el descanso entre ellos.
 */
export function nextOccurrence(now: Date, day: DayOfWeek, startTime: string): Date {
  const nowIsoDay = ((now.getUTCDay() + 6) % 7) + 1;
  const daysUntil = (day - nowIsoDay + 7) % 7;
  const minutesOfDay = toMinutesOfDay(startTime);
  const hours = Math.floor(minutesOfDay / 60);
  const minutes = minutesOfDay % 60;
  let candidate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntil, hours, minutes, 0, 0),
  );
  if (candidate.getTime() < now.getTime()) {
    candidate = new Date(candidate.getTime() + 7 * MS_PER_DAY);
  }
  return candidate;
}

/**
 * `NotificationPlanner` (dominio puro, RN-15/RN-16, ADR-010): dado un
 * conjunto de `ScheduleSlot` y `now`, calcula qué notificaciones locales
 * mantener programadas dentro de la ventana móvil `[now, now+7d]`
 * (`PLANNING_WINDOW_DAYS`), respetando las horas de silencio (salvo tipos
 * exentos, RN-16), el tope diario de notificaciones y el límite documentado
 * de notificaciones locales pendientes en iOS (`IOS_MAX_PENDING_NOTIFICATIONS`).
 */
export function planNotifications(input: NotificationPlannerInput): PlannedNotification[] {
  const windowEnd = new Date(input.now.getTime() + PLANNING_WINDOW_DAYS * MS_PER_DAY);
  const routineById = new Map(input.routineSummaries.map((routine) => [routine.id, routine] as const));
  const activeStartBySlot = new Map(
    (input.activeSessionStarts ?? []).map((start) => [start.scheduleSlotId, start] as const),
  );

  const candidates: PlannedNotification[] = [];

  for (const slot of input.slots) {
    if (!slot.active) {
      continue;
    }
    const routine = routineById.get(slot.routineId);
    if (!routine) {
      continue;
    }

    for (const day of slot.daysOfWeek) {
      const occurrence = nextOccurrence(input.now, day, slot.startTime);
      const preReminderAt = new Date(occurrence.getTime() - slot.reminderOffsetMin * MS_PER_MINUTE);
      const activeStart = activeStartBySlot.get(slot.id);
      const expectedEndAt = activeStart
        ? new Date(activeStart.actualStartAt.getTime() + routine.estimatedDurationSeconds * 1000)
        : new Date(occurrence.getTime() + routine.estimatedDurationSeconds * 1000);

      candidates.push(
        {
          scheduleSlotId: slot.id,
          routineId: slot.routineId,
          routineName: routine.name,
          type: "PRE_REMINDER",
          fireAt: preReminderAt,
        },
        {
          scheduleSlotId: slot.id,
          routineId: slot.routineId,
          routineName: routine.name,
          type: "START",
          fireAt: occurrence,
        },
        {
          scheduleSlotId: slot.id,
          routineId: slot.routineId,
          routineName: routine.name,
          type: "EXPECTED_END",
          fireAt: expectedEndAt,
        },
      );
    }
  }

  candidates.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());

  const countsByDay = new Map<string, number>([[dateKey(input.now), input.notificationsAlreadyCountedToday]]);
  const result: PlannedNotification[] = [];

  for (const candidate of candidates) {
    if (candidate.fireAt.getTime() < input.now.getTime() || candidate.fireAt.getTime() > windowEnd.getTime()) {
      continue;
    }
    // `isExemptFromQuietHours`/`shouldDeliverGivenDailyCap` se aplican de
    // forma genérica (cualquier `NotificationType` futuro), pero en H2 los
    // únicos tipos que este planificador genera (PRE_REMINDER/START/
    // EXPECTED_END) están siempre exentos de ambas reglas (RN-16): por eso
    // estas dos condiciones nunca descartan nada todavía. `MISSED` (el único
    // tipo no exento) pertenece a "avisos de reactivación", una feature
    // futura fuera del alcance de F04 (ver comentario de
    // `NotificationPlanner.dailyCap.test.ts`), que sí ejercitará esta rama
    // cuando exista. Las funciones puras siguen exportadas y 100 % probadas
    // por su cuenta (CA-04.06.1/CA-04.06.2) para ese momento.
    /* istanbul ignore next -- inalcanzable en H2: los 3 tipos generados aquí están siempre exentos (ver comentario arriba) */
    if (!isExemptFromQuietHours(candidate.type) && isWithinQuietHours(candidate.fireAt, input.preferences.quietHours)) {
      continue;
    }

    const day = dateKey(candidate.fireAt);
    const alreadyCounted = countsByDay.get(day) ?? 0;
    /* istanbul ignore next -- inalcanzable en H2: los 3 tipos generados aquí están siempre exentos (ver comentario arriba) */
    if (!shouldDeliverGivenDailyCap(candidate.type, alreadyCounted, input.preferences.maxNotificationsPerDay)) {
      continue;
    }
    /* istanbul ignore next -- inalcanzable en H2: los 3 tipos generados aquí están siempre exentos (ver comentario arriba) */
    if (!TYPES_EXEMPT_FROM_DAILY_CAP.includes(candidate.type)) {
      countsByDay.set(day, alreadyCounted + 1);
    }

    result.push(candidate);
    if (result.length >= IOS_MAX_PENDING_NOTIFICATIONS) {
      break;
    }
  }

  return result;
}

/** CA-04.06.1: horas de silencio, incluido el cruce de medianoche (p. ej. 22:00-07:00). */
export function isWithinQuietHours(time: Date, quietHours: QuietHours | null): boolean {
  if (!quietHours) {
    return false;
  }
  const minutesOfDay = time.getUTCHours() * 60 + time.getUTCMinutes();
  const start = toMinutesOfDay(quietHours.start);
  const end = toMinutesOfDay(quietHours.end);
  if (start === end) {
    return false;
  }
  if (start < end) {
    return minutesOfDay >= start && minutesOfDay < end;
  }
  // Cruza medianoche (p. ej. 22:00-07:00): dentro si es igual/después del
  // inicio, o antes del fin (del día siguiente).
  return minutesOfDay >= start || minutesOfDay < end;
}

/** CA-04.06.1 / RN-16: los avisos de sesión son time-critical y no respetan las horas de silencio. */
export function isExemptFromQuietHours(type: NotificationType): boolean {
  return TYPES_EXEMPT_FROM_DAILY_CAP.includes(type);
}

/** CA-04.06.2 / RN-16: decide si una notificación se entrega dado el tope diario ya alcanzado. */
export function shouldDeliverGivenDailyCap(
  type: NotificationType,
  notificationsAlreadyCountedToday: number,
  maxNotificationsPerDay: number,
): boolean {
  if (TYPES_EXEMPT_FROM_DAILY_CAP.includes(type)) {
    return true;
  }
  return notificationsAlreadyCountedToday < maxNotificationsPerDay;
}
