import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { apiClient } from "@/shared/infrastructure/http/mutator";
import type { AuthError, AuthPort, AuthSession, LoginInput, RegisterInput } from "../application/ports";

/**
 * `HttpAuthAdapter` (RF-01.01, tarea `F01-T10`): implementa `AuthPort` contra
 * `POST /auth/register`, `/auth/login`, `/auth/guest/upgrade`, `DELETE /me`
 * (`packages/api-contract/openapi.yaml`). Igual que `HttpCatalogAdapter`
 * (`features/catalog/infrastructure/HttpCatalogAdapter.ts`), construye las
 * llamadas directamente sobre `apiClient` en vez de usar las funciones
 * generadas por orval (`shared/infrastructure/http/generated/identity`):
 * esas funciones asumen que el mutator devuelve `{data, status, headers}`
 * (patrón `httpClient: "fetch"` de orval), mientras que `apiClient` ya
 * devuelve el cuerpo JSON parseado y lanza en `!response.ok`. Alinear ambos
 * contratos es una decisión más amplia que excede el alcance de F01 (afecta
 * también a `catalog`/`sync`), documentada como el mismo riesgo ya anotado
 * en `HttpCatalogAdapter`.
 *
 * El token de acceso (`Bearer`) para `DELETE /me` se inyecta desde
 * `src/composition/container.ts` (el propio `HttpAuthAdapter` no conoce
 * `TokenStoragePort`: sería una dependencia circular entre dos adaptadores
 * de la misma feature; en su lugar recibe una función `getAccessToken()`).
 */
export type GetAccessToken = () => Promise<string | null>;

interface RawAuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
}

export class HttpAuthAdapter implements AuthPort {
  constructor(
    private readonly baseUrl: string,
    private readonly getAccessToken: GetAccessToken = async () => null,
  ) {}

  async register(input: RegisterInput): Promise<Result<AuthSession, AuthError>> {
    return this.postAuth("/auth/register", input);
  }

  async login(input: LoginInput): Promise<Result<AuthSession, AuthError>> {
    return this.postAuth("/auth/login", input);
  }

  async guestUpgrade(input: RegisterInput): Promise<Result<AuthSession, AuthError>> {
    return this.postAuth("/auth/guest/upgrade", input);
  }

  async deleteAccount(): Promise<Result<void, AuthError>> {
    try {
      const accessToken = await this.getAccessToken();
      await apiClient<void>(`${this.baseUrl}/me`, {
        method: "DELETE",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      return ok(undefined);
    } catch (error) {
      return err(toAuthError(error));
    }
  }

  private async postAuth(
    path: string,
    body: RegisterInput | LoginInput,
  ): Promise<Result<AuthSession, AuthError>> {
    try {
      const requestBody =
        "acceptedTermsVersion" in body
          ? { ...body, healthDataConsent: true }
          : body;
      const raw = await apiClient<RawAuthTokens>(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      return ok({
        accessToken: raw.accessToken,
        refreshToken: raw.refreshToken,
        user: { id: asId(raw.user.id), email: raw.user.email },
      });
    } catch (error) {
      return err(toAuthError(error));
    }
  }
}

/**
 * `apiClient` (mutator.ts) solo expone el mensaje `HTTP <status> al llamar a
 * <url>` (no el cuerpo del error RFC 9457 todavía): se traduce el status a un
 * `code` genérico. Punto de extensión para cuando `mutator.ts` propague el
 * `Problem` completo, sin que el resto de `HttpAuthAdapter` tenga que cambiar.
 */
function toAuthError(error: unknown): AuthError {
  if (error instanceof Error) {
    const statusMatch = /^HTTP (\d+)/.exec(error.message);
    return {
      code: statusMatch?.[1] ? `HTTP_${statusMatch[1]}` : "UNKNOWN",
      message: error.message,
    };
  }
  return { code: "UNKNOWN", message: String(error) };
}
