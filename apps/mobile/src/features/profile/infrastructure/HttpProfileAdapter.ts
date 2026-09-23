import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { apiClient } from "@/shared/infrastructure/http/mutator";
import type { AuthError, RemoteProfilePort } from "../application/ports";
import type { UserProfile } from "../domain/UserProfile";
import type { GetAccessToken } from "./HttpAuthAdapter";

/**
 * `HttpProfileAdapter` (RF-01.03/RF-01.06, tarea `F01-T12`/`F01-T16`):
 * implementa `RemoteProfilePort` contra `PUT /me/profile`
 * (`packages/api-contract/openapi.yaml`, esquema `UserProfileDto`). Mismo
 * patrón que `HttpAuthAdapter` (llama directamente a `apiClient` en vez de
 * usar el cliente generado por orval, mismo motivo documentado ahí) y mismo
 * mecanismo de inyección de `Authorization` vía un `getAccessToken()`
 * inyectado desde `src/composition/container.ts` (evita una dependencia
 * circular entre dos adaptadores de la misma feature).
 */
export class HttpProfileAdapter implements RemoteProfilePort {
  constructor(
    private readonly baseUrl: string,
    private readonly getAccessToken: GetAccessToken = async () => null,
  ) {}

  async update(profile: UserProfile): Promise<Result<void, AuthError>> {
    try {
      const accessToken = await this.getAccessToken();
      await apiClient<unknown>(`${this.baseUrl}/me/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(toUserProfileDto(profile)),
      });
      return ok(undefined);
    } catch (error) {
      return err(toAuthError(error));
    }
  }
}

function toUserProfileDto(profile: UserProfile): Record<string, unknown> {
  return {
    id: profile.id,
    birthDate: profile.birthDate.toISOString().slice(0, 10),
    gender: profile.gender,
    heightCm: profile.heightCm,
    goal: profile.goal,
    level: profile.level,
    daysPerWeek: profile.daysPerWeek,
    minutesPerSession: profile.minutesPerSession,
    equipment: profile.equipment,
    unitSystem: profile.unitSystem,
    targetWeightKg: profile.targetWeightKg,
  };
}

/**
 * Misma traducción que `HttpAuthAdapter.toAuthError` (duplicada a propósito:
 * son dos adaptadores de módulos backend distintos, `identity` vs `profile`,
 * que no deben depender el uno del otro solo para compartir esta función
 * utilitaria de tres líneas).
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
