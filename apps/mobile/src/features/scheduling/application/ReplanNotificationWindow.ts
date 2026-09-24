import { err, isErr, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { Id } from "@/shared/domain/Id";
import { strings } from "@/shared/i18n";
import { TYPES_EXEMPT_FROM_DAILY_CAP, planNotifications } from "../domain/NotificationPlanner";
import type { NotificationType, PlannedNotification } from "../domain/NotificationPlanner";
import { buildSessionStartDeepLink } from "../domain/deepLink";
import type {
  NotificationScheduler,
  PlannedNotificationContent,
  PlannedNotificationRecord,
  PlannedNotificationRepository,
  PostponeCounterRepository,
  RepositoryError,
  RoutineSummaryLookupPort,
  ScheduleSlotRepository,
  SchedulingPreferencesRepository,
} from "./ports";

function notificationBody(type: NotificationType): string {
  switch (type) {
    case "PRE_REMINDER":
      return strings.scheduling.notifications.preReminderBody;
    case "START":
      return strings.scheduling.notifications.startBody;
    case "EXPECTED_END":
      return strings.scheduling.notifications.expectedEndBody;
    case "MISSED":
      return strings.scheduling.notifications.missedBody;
  }
}

function keyOf(notification: { scheduleSlotId: Id; type: NotificationType; fireAt: Date }): string {
  return `${notification.scheduleSlotId}:${notification.type}:${notification.fireAt.getTime()}`;
}

export interface ReplanNotificationWindowResult {
  scheduled: number;
  cancelled: number;
}

export interface ReplanNotificationWindowDeps {
  scheduleSlotRepository: ScheduleSlotRepository;
  plannedNotificationRepository: PlannedNotificationRepository;
  notificationScheduler: NotificationScheduler;
  routineSummaryLookupPort: RoutineSummaryLookupPort;
  schedulingPreferencesRepository: SchedulingPreferencesRepository;
  postponeCounterRepository: PostponeCounterRepository;
  clock: Clock;
}

/**
 * `ReplanNotificationWindow` (ADR-010, CA-04.01.2, CA-04.03.1): único punto
 * que materializa la ventana móvil de 7 días contra el sistema operativo
 * real (`NotificationScheduler`). Se invoca al abrir la app, tras cualquier
 * cambio de programación local y tras un `pull` de sincronización con
 * cambios de `scheduleSlot` (ADR-010 "Decisión").
 *
 * `cancelExpectedEnd` cubre la segunda mitad de CA-04.03.1 ("si termino la
 * sesión antes, EXPECTED_END se cancela"): método dedicado propuesto por
 * `qa-pruebas` para poder expresarlo en H2 sin `workout-session` (F05, H3) —
 * se invocaría desde el mecanismo local que registre "la sesión terminó".
 *
 */
export class ReplanNotificationWindow {
  constructor(private readonly deps: ReplanNotificationWindowDeps) {}

  async execute(): Promise<Result<ReplanNotificationWindowResult, RepositoryError>> {
    const {
      scheduleSlotRepository,
      plannedNotificationRepository,
      notificationScheduler,
      routineSummaryLookupPort,
      schedulingPreferencesRepository,
      clock,
    } = this.deps;

    const slotsResult = await scheduleSlotRepository.listActive();
    if (isErr(slotsResult)) {
      return slotsResult;
    }
    const slots = slotsResult.value;

    const preferencesResult = await schedulingPreferencesRepository.load();
    if (isErr(preferencesResult)) {
      return preferencesResult;
    }

    const existingResult = await plannedNotificationRepository.listAll();
    if (isErr(existingResult)) {
      return existingResult;
    }
    const existing = existingResult.value;

    const now = clock.now();
    const uniqueRoutineIds = [...new Set(slots.map((slot) => slot.routineId))];
    const summaryResults = await Promise.all(
      uniqueRoutineIds.map((routineId) => routineSummaryLookupPort.summarize(routineId)),
    );
    const routineSummaries = summaryResults.filter(isOk).map((result) => result.value);

    const todayKey = now.toISOString().slice(0, 10);
    const notificationsAlreadyCountedToday = existing.filter(
      (record) =>
        record.delivered &&
        !TYPES_EXEMPT_FROM_DAILY_CAP.includes(record.type) &&
        record.fireAt.toISOString().slice(0, 10) === todayKey,
    ).length;

    const planned = planNotifications({
      slots,
      routineSummaries,
      preferences: preferencesResult.value,
      postponeCounters: [],
      notificationsAlreadyCountedToday,
      now,
    });

    const plannedKeys = new Set(planned.map(keyOf));
    const existingKeys = new Set(existing.map(keyOf));

    const toCancel = existing.filter((record) => record.osNotificationId !== null && !plannedKeys.has(keyOf(record)));
    for (const record of toCancel) {
      await notificationScheduler.cancel(record.osNotificationId as string);
    }

    const keptRecords = existing.filter((record) => plannedKeys.has(keyOf(record)));
    const toSchedule = planned.filter((notification) => !existingKeys.has(keyOf(notification)));

    const newRecords: PlannedNotificationRecord[] = [];
    for (const notification of toSchedule) {
      newRecords.push(await this.scheduleOne(notification));
    }

    const replaceResult = await plannedNotificationRepository.replaceAll([...keptRecords, ...newRecords]);
    if (isErr(replaceResult)) {
      return replaceResult;
    }

    return ok({ scheduled: newRecords.length, cancelled: toCancel.length });
  }

  private async scheduleOne(notification: PlannedNotification): Promise<PlannedNotificationRecord> {
    const content: PlannedNotificationContent = {
      scheduleSlotId: notification.scheduleSlotId,
      type: notification.type,
      fireAt: notification.fireAt,
      title: notification.routineName,
      body: notificationBody(notification.type),
      deepLink: buildSessionStartDeepLink(notification.scheduleSlotId),
    };
    const scheduled = await this.deps.notificationScheduler.schedule(content);
    return {
      ...notification,
      osNotificationId: isOk(scheduled) ? scheduled.value : null,
      delivered: false,
    };
  }

  /** CA-04.03.1 (segunda mitad): "si termino la sesión antes, EXPECTED_END se cancela". */
  async cancelExpectedEnd(scheduleSlotId: Id): Promise<Result<void, RepositoryError>> {
    const { plannedNotificationRepository, notificationScheduler } = this.deps;

    const listResult = await plannedNotificationRepository.listAll();
    if (isErr(listResult)) {
      return listResult;
    }
    const records = listResult.value;

    const toCancel = records.filter(
      (record) => record.scheduleSlotId === scheduleSlotId && record.type === "EXPECTED_END",
    );
    for (const record of toCancel) {
      if (record.osNotificationId !== null) {
        const cancelResult = await notificationScheduler.cancel(record.osNotificationId);
        if (isErr(cancelResult)) {
          return err({ kind: "UNKNOWN", message: "No se pudo cancelar la notificación EXPECTED_END." });
        }
      }
    }

    const remaining = records.filter(
      (record) => !(record.scheduleSlotId === scheduleSlotId && record.type === "EXPECTED_END"),
    );
    return plannedNotificationRepository.replaceAll(remaining);
  }
}
