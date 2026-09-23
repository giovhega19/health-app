import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { apiClient } from "@/shared/infrastructure/http/mutator";
import type { PullResult, PushResult, RemoteChange, SyncHttpError, SyncTransportPort } from "../application/ports";

/**
 * `HttpSyncAdapter` (ADR-002, tarea `F01-T08`): implementa `SyncTransportPort`
 * contra `POST /sync/push`/`GET /sync/pull` (`packages/api-contract/openapi.yaml`).
 * Mismo patrón que `HttpAuthAdapter`/`HttpCatalogAdapter`: construye la
 * llamada directamente sobre `apiClient` en vez de las funciones generadas
 * por orval, por la misma razón de contrato de respuesta ya documentada ahí.
 */
export type GetAccessToken = () => Promise<string | null>;

interface RawPushResponse {
  accepted: string[];
  rejected: { id: string; code: string; detail?: string }[];
  serverTime: string;
}

interface RawPullResponse {
  changes: RemoteChange[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export class HttpSyncAdapter implements SyncTransportPort {
  constructor(
    private readonly baseUrl: string,
    private readonly getAccessToken: GetAccessToken = async () => null,
  ) {}

  async push(deviceId: string, changes: RemoteChange[]): Promise<Result<PushResult, SyncHttpError>> {
    try {
      const accessToken = await this.getAccessToken();
      const raw = await apiClient<RawPushResponse>(`${this.baseUrl}/sync/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ deviceId, changes }),
      });
      return ok(raw);
    } catch (error) {
      return err(toSyncHttpError(error));
    }
  }

  async pull(cursor: string | null): Promise<Result<PullResult, SyncHttpError>> {
    try {
      const accessToken = await this.getAccessToken();
      const url = new URL(`${this.baseUrl}/sync/pull`);
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }
      const raw = await apiClient<RawPullResponse>(url.toString(), {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      return ok({ changes: raw.changes, nextCursor: raw.nextCursor ?? null, hasMore: raw.hasMore });
    } catch (error) {
      return err(toSyncHttpError(error));
    }
  }
}

function toSyncHttpError(error: unknown): SyncHttpError {
  const message = error instanceof Error ? error.message : String(error);
  const statusMatch = /^HTTP (\d+)/.exec(message);
  if (statusMatch?.[1]) {
    return { kind: "SERVER_ERROR", status: Number(statusMatch[1]) };
  }
  return { kind: "NETWORK_ERROR", message };
}
