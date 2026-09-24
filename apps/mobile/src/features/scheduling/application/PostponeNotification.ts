import { err, isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { Id } from "@/shared/domain/Id";
import { strings } from "@/shared/i18n";
import { canPostpone, incrementPostponeCounter } from "../domain/PostponeCounter";
import { buildSessionStartDeepLink } from "../domain/deepLink";
import type { NotificationPostponedEvent } from "../domain/events";
import type {
  NotificationError,
  NotificationScheduler,
  PlannedNotificationContent,
  PostponeCounterRepository,
  RepositoryError,
} from "./ports";

export type PostponeMinutes = 10 | 30 | 60;

export interface PostponeNotificationCommand {
  scheduleSlotId: Id;
  minutes: PostponeMinutes;
}

export type PostponeNotificationError =
  | RepositoryError
  | NotificationError
  | { kind: "POSTPONE_LIMIT_REACHED"; postponeCountToday: number };

export interface PostponeNotificationDeps {
  postponeCounterRepository: PostponeCounterRepository;
  notificationScheduler: NotificationScheduler;
  eventBus: EventBus;
  clock: Clock;
}

/**
 * `PostponeNotification` (CA-04.05.1: "Posponer 30 min" en la notificación
 * START -> nueva notificación START 30 min después, máximo 3/día).
 *
 */
export class PostponeNotification {
  constructor(private readonly deps: PostponeNotificationDeps) {}

  async execute(command: PostponeNotificationCommand): Promise<Result<void, PostponeNotificationError>> {
    const { postponeCounterRepository, notificationScheduler, eventBus, clock } = this.deps;
    const now = clock.now();
    const dateKey = now.toISOString().slice(0, 10);

    const counterResult = await postponeCounterRepository.get(dateKey, command.scheduleSlotId);
    if (isErr(counterResult)) {
      return counterResult;
    }
    const counter = counterResult.value;
    if (!canPostpone(counter)) {
      return err({ kind: "POSTPONE_LIMIT_REACHED", postponeCountToday: counter.count });
    }

    const fireAt = new Date(now.getTime() + command.minutes * 60_000);
    const content: PlannedNotificationContent = {
      scheduleSlotId: command.scheduleSlotId,
      type: "START",
      fireAt,
      title: strings.scheduling.notifications.postponedTitle,
      body: strings.scheduling.notifications.startBody,
      deepLink: buildSessionStartDeepLink(command.scheduleSlotId),
    };
    const scheduleResult = await notificationScheduler.schedule(content);
    if (isErr(scheduleResult)) {
      return scheduleResult;
    }

    const updatedCounter = incrementPostponeCounter(counter);
    const saveResult = await postponeCounterRepository.save(updatedCounter);
    if (isErr(saveResult)) {
      return saveResult;
    }

    const event: NotificationPostponedEvent = {
      type: "NotificationPostponed",
      occurredAt: now,
      scheduleSlotId: command.scheduleSlotId,
      newFireAt: fireAt,
      postponeCountToday: updatedCounter.count,
    };
    await eventBus.publish(event);

    return ok(undefined);
  }
}
