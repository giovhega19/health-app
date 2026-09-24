import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { NotificationError, NotificationScheduler } from "./ports";

export interface RequestNotificationPermissionResult {
  status: "GRANTED" | "DENIED";
}

export interface RequestNotificationPermissionDeps {
  notificationScheduler: NotificationScheduler;
}

/**
 * `RequestNotificationPermission` (CA-04.01.3: si el usuario deniega el
 * permiso, no es un error del caso de uso — es un resultado válido, "la
 * programación sigue funcionando sin avisos"). El aviso con botón a los
 * ajustes del sistema es `presentation/components/PermissionDeniedBanner.tsx`
 * (F04-T13), fuera de esta capa.
 *
 */
export class RequestNotificationPermission {
  constructor(private readonly deps: RequestNotificationPermissionDeps) {}

  async execute(): Promise<Result<RequestNotificationPermissionResult, NotificationError>> {
    const result = await this.deps.notificationScheduler.requestPermission();
    if (!result.ok) {
      return result;
    }
    return ok({ status: result.value });
  }
}
