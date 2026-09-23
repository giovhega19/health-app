import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { AuthError, AuthPort, AuthSession, LoginInput, StorageError, TokenStoragePort } from "./ports";

/**
 * `LoginUser` (RF-01.01, tarea `F01-T12`). Análogo a `CreateAccount`/
 * `ContinueAsGuest`, pero para un usuario que ya tiene cuenta: llama a
 * `AuthPort.login` (`POST /auth/login`) y guarda la sesión con
 * `TokenStoragePort`. Lo usa la pantalla "Iniciar sesión" (`F01-T16`), a la
 * que se llega desde el estado "Email ya registrado: se ofrece iniciar
 * sesión" (`spec.md` "Estados de UI") y también un usuario que reinstala la
 * app (sin perfil local todavía, a diferencia de `CreateAccount`/
 * `ContinueAsGuest`, que sí requieren uno).
 *
 * CA-01.08.1 (última línea): tras eliminar la cuenta, iniciar sesión con
 * esas credenciales debe devolver "credenciales inválidas" sin lanzar.
 * `HttpAuthAdapter.login` ya no lanza (captura la excepción HTTP y la
 * traduce a `Result.err`, ver su comentario y prueba), pero como
 * `mutator.ts` todavía no propaga el cuerpo `Problem` de la respuesta
 * (`shared/infrastructure/http/mutator.ts`), el `code` que produce hoy es el
 * genérico `HTTP_401`. Como un 401 de `/auth/login` solo puede significar
 * "credenciales inválidas" (`packages/api-contract/openapi.yaml`), se
 * traduce aquí al código real del contrato (`AUTH_INVALID_CREDENTIALS`) en
 * vez de tocar `HttpAuthAdapter` (que ya tiene su propia prueba fijando
 * `HTTP_401` para ese caso, compartido con `register`/`guestUpgrade`).
 */
export interface LoginUserCommand {
  email: string;
  password: string;
}

export interface LoginUserResult {
  session: AuthSession;
}

export type LoginUserError = AuthError | StorageError;

export interface LoginUserDeps {
  authPort: AuthPort;
  tokenStoragePort: TokenStoragePort;
}

export class LoginUser {
  constructor(private readonly deps: LoginUserDeps) {}

  async execute(command: LoginUserCommand): Promise<Result<LoginUserResult, LoginUserError>> {
    const input: LoginInput = { email: command.email, password: command.password };
    const sessionResult = await this.deps.authPort.login(input);
    if (!sessionResult.ok) {
      return err(translateLoginError(sessionResult.error));
    }
    const session = sessionResult.value;

    const storageResult = await this.deps.tokenStoragePort.save(session);
    if (!storageResult.ok) {
      return storageResult;
    }

    return ok({ session });
  }
}

function translateLoginError(error: AuthError): AuthError {
  if (error.code === "HTTP_401") {
    return { code: "AUTH_INVALID_CREDENTIALS", message: error.message };
  }
  return error;
}
