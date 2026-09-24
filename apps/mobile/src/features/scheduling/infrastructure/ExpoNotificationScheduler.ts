import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { NotificationType } from "../domain/NotificationPlanner";
import type { NotificationError, NotificationScheduler, PlannedNotificationContent } from "../application/ports";

/**
 * Canales Android (`specs/F04-programacion-recordatorios/spec.md`
 * §"Diseño técnico relevante"): `reminders` (recordatorios normales),
 * `workout-timer` (alta prioridad, avisos time-critical de sesión activa),
 * `motivation` (reactivación, RN-15, reservado para una feature futura).
 */
const CHANNELS = {
  reminders: "reminders",
  workoutTimer: "workout-timer",
  motivation: "motivation",
} as const;

function channelFor(type: NotificationType): string {
  switch (type) {
    case "START":
    case "EXPECTED_END":
      return CHANNELS.workoutTimer;
    case "PRE_REMINDER":
    case "MISSED":
    default:
      return CHANNELS.reminders;
  }
}

/**
 * `ExpoNotificationScheduler` (tarea `F04-T11`): adaptador real del puerto
 * `NotificationScheduler` sobre `expo-notifications`. `ReplanNotificationWindow`
 * (aplicación) es el único punto que lo invoca (ADR-010).
 */
export class ExpoNotificationScheduler implements NotificationScheduler {
  private channelsEnsured = false;

  async requestPermission(): Promise<Result<"GRANTED" | "DENIED", NotificationError>> {
    try {
      await this.ensureAndroidChannels();
      const { status } = await Notifications.requestPermissionsAsync();
      return ok(status === "granted" ? "GRANTED" : "DENIED");
    } catch (error) {
      return err({ kind: "UNKNOWN", message: messageOf(error) });
    }
  }

  async getPermissionStatus(): Promise<"GRANTED" | "DENIED" | "UNDETERMINED"> {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return "GRANTED";
    if (status === "denied") return "DENIED";
    return "UNDETERMINED";
  }

  async schedule(notification: PlannedNotificationContent): Promise<Result<string, NotificationError>> {
    try {
      await this.ensureAndroidChannels();
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { deepLink: notification.deepLink, scheduleSlotId: notification.scheduleSlotId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notification.fireAt,
          channelId: channelFor(notification.type),
        },
      });
      return ok(id);
    } catch (error) {
      return err({ kind: "SCHEDULING_FAILED", message: messageOf(error) });
    }
  }

  async cancel(osNotificationId: string): Promise<Result<void, NotificationError>> {
    try {
      await Notifications.cancelScheduledNotificationAsync(osNotificationId);
      return ok(undefined);
    } catch (error) {
      return err({ kind: "UNKNOWN", message: messageOf(error) });
    }
  }

  async cancelAll(): Promise<Result<void, NotificationError>> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return ok(undefined);
    } catch (error) {
      return err({ kind: "UNKNOWN", message: messageOf(error) });
    }
  }

  private async ensureAndroidChannels(): Promise<void> {
    if (this.channelsEnsured || Platform.OS !== "android") {
      return;
    }
    await Notifications.setNotificationChannelAsync(CHANNELS.reminders, {
      name: "Recordatorios",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync(CHANNELS.workoutTimer, {
      name: "Temporizador de entrenamiento",
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync(CHANNELS.motivation, {
      name: "Motivación",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    this.channelsEnsured = true;
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
