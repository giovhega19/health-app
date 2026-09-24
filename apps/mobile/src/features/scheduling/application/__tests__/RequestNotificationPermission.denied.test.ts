/**
 * CA-04.01.3 Permiso denegado: "Dado que el usuario denegó el permiso de
 * notificaciones, entonces el calendario muestra un aviso con un botón a
 * los ajustes del sistema, y la programación sigue funcionando sin avisos."
 * (el aviso/botón es `presentation/components/PermissionDeniedBanner.tsx`,
 * F04-T13, fuera del alcance de esta prueba de aplicación).
 *
 * `RequestNotificationPermission.execute` (tarea `F04-T08`) lanza
 * deliberadamente — rojo TDD esperado.
 */
import { isOk } from "@/shared/domain/Result";
import { RequestNotificationPermission } from "../RequestNotificationPermission";
import { FakeNotificationScheduler } from "@test/fakes/FakeNotificationScheduler";

describe("CA-04.01.3 RequestNotificationPermission — permiso denegado", () => {
  it("si el usuario deniega el permiso, el resultado es DENIED (no un error): la programación sigue funcionando", async () => {
    const notificationScheduler = new FakeNotificationScheduler();
    notificationScheduler.permissionToGrant = "DENIED";
    const useCase = new RequestNotificationPermission({ notificationScheduler });

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.status).toBe("DENIED");
    }
  });

  it("si el usuario concede el permiso, el resultado es GRANTED", async () => {
    const notificationScheduler = new FakeNotificationScheduler();
    notificationScheduler.permissionToGrant = "GRANTED";
    const useCase = new RequestNotificationPermission({ notificationScheduler });

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.status).toBe("GRANTED");
    }
  });
});
