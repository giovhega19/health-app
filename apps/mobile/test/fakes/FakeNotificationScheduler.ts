import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type {
  NotificationError,
  NotificationScheduler,
  PlannedNotificationContent,
} from "@/features/scheduling/application/ports";

/**
 * Fake en memoria de `NotificationScheduler` (`features/scheduling/application/ports.ts`).
 * Nunca contra el scheduler real del SO (07-estrategia-pruebas.md).
 */
export class FakeNotificationScheduler implements NotificationScheduler {
  permissionToGrant: "GRANTED" | "DENIED" = "GRANTED";
  permissionStatus: "GRANTED" | "DENIED" | "UNDETERMINED" = "UNDETERMINED";
  readonly scheduledCalls: PlannedNotificationContent[] = [];
  readonly cancelledIds: string[] = [];
  cancelAllCalls = 0;
  private nextOsId = 1;

  async requestPermission(): Promise<Result<"GRANTED" | "DENIED", NotificationError>> {
    this.permissionStatus = this.permissionToGrant;
    return ok(this.permissionToGrant);
  }

  async getPermissionStatus(): Promise<"GRANTED" | "DENIED" | "UNDETERMINED"> {
    return this.permissionStatus;
  }

  async schedule(notification: PlannedNotificationContent): Promise<Result<string, NotificationError>> {
    this.scheduledCalls.push(notification);
    const id = `os-notification-${this.nextOsId++}`;
    return ok(id);
  }

  async cancel(osNotificationId: string): Promise<Result<void, NotificationError>> {
    this.cancelledIds.push(osNotificationId);
    return ok(undefined);
  }

  async cancelAll(): Promise<Result<void, NotificationError>> {
    this.cancelAllCalls += 1;
    return ok(undefined);
  }
}
