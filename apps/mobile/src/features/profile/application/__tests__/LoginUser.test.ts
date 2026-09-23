/**
 * RF-01.01 `LoginUser` (`features/profile/application/LoginUser.ts`, tarea
 * `F01-T12`). CA-01.08.1 (última línea): "al intentar iniciar sesión con
 * esas credenciales [de una cuenta ya eliminada] recibo 'credenciales
 * inválidas'" sin lanzar.
 */
import { LoginUser } from "../LoginUser";
import { err, isErr, isOk } from "@/shared/domain/Result";
import { FakeAuthPort } from "@test/fakes/FakeAuthPort";
import { FakeTokenStoragePort } from "@test/fakes/FakeTokenStoragePort";

describe("RF-01.01 LoginUser", () => {
  it("con credenciales válidas, inicia sesión y guarda los tokens", async () => {
    const authPort = new FakeAuthPort();
    const tokenStoragePort = new FakeTokenStoragePort();
    const useCase = new LoginUser({ authPort, tokenStoragePort });

    const result = await useCase.execute({ email: "ana@fitapp.test", password: "Sup3rSecret!" });

    expect(isOk(result)).toBe(true);
    expect(authPort.loginCalls).toHaveLength(1);
    expect(authPort.loginCalls[0]).toEqual({ email: "ana@fitapp.test", password: "Sup3rSecret!" });
    expect(tokenStoragePort.saveCalls).toHaveLength(1);
  });

  it("CA-01.08.1 con credenciales inválidas (HTTP 401 de HttpAuthAdapter), devuelve AUTH_INVALID_CREDENTIALS sin lanzar ni guardar tokens", async () => {
    const authPort = new FakeAuthPort();
    authPort.loginResult = err({ code: "HTTP_401", message: "HTTP 401 al llamar a /auth/login" });
    const tokenStoragePort = new FakeTokenStoragePort();
    const useCase = new LoginUser({ authPort, tokenStoragePort });

    const result = await useCase.execute({ email: "ana@fitapp.test", password: "wrong-password" });

    expect(isErr(result)).toBe(true);
    if (isErr(result) && "code" in result.error) {
      expect(result.error.code).toBe("AUTH_INVALID_CREDENTIALS");
    }
    expect(tokenStoragePort.saveCalls).toHaveLength(0);
  });

  it("con un error de red distinto de 401, propaga el código original sin traducirlo", async () => {
    const authPort = new FakeAuthPort();
    authPort.loginResult = err({ code: "HTTP_500", message: "HTTP 500 al llamar a /auth/login" });
    const tokenStoragePort = new FakeTokenStoragePort();
    const useCase = new LoginUser({ authPort, tokenStoragePort });

    const result = await useCase.execute({ email: "ana@fitapp.test", password: "Sup3rSecret!" });

    expect(isErr(result)).toBe(true);
    if (isErr(result) && "code" in result.error) {
      expect(result.error.code).toBe("HTTP_500");
    }
  });

  it("si falla al guardar el token localmente, devuelve un Result de error", async () => {
    const authPort = new FakeAuthPort();
    const tokenStoragePort = new FakeTokenStoragePort();
    tokenStoragePort.saveResult = err({ kind: "STORAGE_ERROR", message: "disco lleno" });
    const useCase = new LoginUser({ authPort, tokenStoragePort });

    const result = await useCase.execute({ email: "ana@fitapp.test", password: "Sup3rSecret!" });

    expect(isErr(result)).toBe(true);
  });
});
