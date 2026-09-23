/**
 * RF-01.08 `DeleteAccount` (`features/profile/application/DeleteAccount.ts`,
 * tarea `F01-T12`, todavía no implementada: esta prueba falla ahora mismo
 * con "Cannot find module '../DeleteAccount'", el estado rojo esperado).
 *
 * CA-01.08.1 (parte móvil): "elijo 'Eliminar cuenta' y confirmo escribiendo
 * 'ELIMINAR' -> se llama a DELETE /me [AuthPort.deleteAccount] y se borran
 * los datos locales". La confirmación de texto "ELIMINAR" es un detalle de
 * la pantalla (`F01-T16`, sin componente todavía); aquí se prueba el límite
 * de aplicación: una vez confirmado, se llama al backend y se limpia todo
 * el almacenamiento local (perfil, historial de peso y tokens). La parte
 * "al intentar iniciar sesión con esas credenciales recibo 'credenciales
 * inválidas'" se verifica en el backend
 * (`identity/application/DeleteAccountTest.java`).
 *
 * Nota de contrato: se asume que `ProfileRepository`/`BodyMetricRepository`
 * exponen `clear()` para el borrado local (ver comentario en
 * `test/fakes/FakeProfileRepository.ts`).
 */
import { DeleteAccount } from "../DeleteAccount";
import { err, isOk } from "@/shared/domain/Result";
import { FakeAuthPort } from "@test/fakes/FakeAuthPort";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeBodyMetricRepository } from "@test/fakes/FakeBodyMetricRepository";
import { FakeTokenStoragePort } from "@test/fakes/FakeTokenStoragePort";

describe("RF-01.08 DeleteAccount", () => {
  it("CA-01.08.1 llama a AuthPort.deleteAccount() (DELETE /me) y borra perfil, historial de peso y tokens locales", async () => {
    const authPort = new FakeAuthPort();
    const profileRepository = new FakeProfileRepository();
    const bodyMetricRepository = new FakeBodyMetricRepository();
    const tokenStoragePort = new FakeTokenStoragePort();
    const useCase = new DeleteAccount({ authPort, profileRepository, bodyMetricRepository, tokenStoragePort });

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    expect(authPort.deleteAccountCalls).toBe(1);
    expect(profileRepository.clearCalls).toBe(1);
    expect(bodyMetricRepository.clearCalls).toBe(1);
    expect(tokenStoragePort.clearCalls).toBe(1);
  });

  it("si el servidor rechaza la eliminación (token inválido/expirado), no borra los datos locales todavía", async () => {
    const authPort = new FakeAuthPort();
    authPort.deleteAccountResult = err({ code: "AUTH_INVALID_TOKEN" });
    const profileRepository = new FakeProfileRepository();
    const bodyMetricRepository = new FakeBodyMetricRepository();
    const tokenStoragePort = new FakeTokenStoragePort();
    const useCase = new DeleteAccount({ authPort, profileRepository, bodyMetricRepository, tokenStoragePort });

    const result = await useCase.execute();

    expect(isOk(result)).toBe(false);
    expect(profileRepository.clearCalls).toBe(0);
    expect(bodyMetricRepository.clearCalls).toBe(0);
    expect(tokenStoragePort.clearCalls).toBe(0);
  });
});
