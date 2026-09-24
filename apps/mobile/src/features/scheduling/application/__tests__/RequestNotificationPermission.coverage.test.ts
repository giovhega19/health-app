/**
 * `RequestNotificationPermission` — prueba adicional de cobertura (Art. 3.2)
 * para la rama de error del propio `NotificationScheduler.requestPermission`
 * (distinta de "denegado", que es un resultado válido, no un error).
 */
import { isErr } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { NotificationError, NotificationScheduler } from "../ports";
import { RequestNotificationPermission } from "../RequestNotificationPermission";

describe("RequestNotificationPermission — error del scheduler", () => {
  it("propaga el error cuando NotificationScheduler.requestPermission falla", async () => {
    const failing: NotificationScheduler = {
      requestPermission: async (): Promise<Result<"GRANTED" | "DENIED", NotificationError>> =>
        ({ ok: false, error: { kind: "UNKNOWN" } }) as Result<"GRANTED" | "DENIED", NotificationError>,
      getPermissionStatus: async () => "UNDETERMINED",
      schedule: async () => {
        throw new Error("no usado en esta prueba");
      },
      cancel: async () => {
        throw new Error("no usado en esta prueba");
      },
      cancelAll: async () => {
        throw new Error("no usado en esta prueba");
      },
    };
    const useCase = new RequestNotificationPermission({ notificationScheduler: failing });

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });
});
