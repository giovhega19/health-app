import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { apiClient } from "@/shared/infrastructure/http/mutator";
import type { CatalogManifest, CatalogManifestPort, HttpError } from "@/features/catalog/application/ports";

/**
 * `HttpCatalogAdapter` implementa `CatalogManifestPort` contra
 * `GET /catalog/manifest`, `GET /catalog/exercises?updatedSince=`,
 * `GET /catalog/routines?updatedSince=` (`packages/api-contract/openapi.yaml`,
 * CA-02.06.1). Usa `apiClient` (el mismo mutator base que consume el cliente
 * generado por orval) en vez de las funciones `useQuery` generadas: esas
 * funciones esperan que el mutator devuelva `{data, status, headers}`
 * (patrón `httpClient: "fetch"` de orval), mientras que `apiClient` ya
 * devuelve el cuerpo JSON parseado directamente (contrato ya cubierto por
 * `shared/infrastructure/http/mutator.test.ts`, H0). Cambiar esa firma es una
 * decisión más amplia que excede el alcance de F02 (afectaría a F01 también),
 * así que este adaptador construye las URLs explícitamente sobre el mismo
 * mutator ya probado.
 */
interface RawCatalogManifest {
  version: number;
  exercisesEtag: string;
  routinesEtag: string;
  mediaBaseUrl: string;
  updatedAt: string;
}

interface RawListResponse {
  items?: unknown[];
}

export class HttpCatalogAdapter implements CatalogManifestPort {
  constructor(private readonly baseUrl: string) {}

  async fetchManifest(): Promise<Result<CatalogManifest, HttpError>> {
    return this.get<RawCatalogManifest, CatalogManifest>(`${this.baseUrl}/catalog/manifest`, (raw) => ({
      version: raw.version,
      exercisesEtag: raw.exercisesEtag,
      routinesEtag: raw.routinesEtag,
      mediaBaseUrl: raw.mediaBaseUrl,
      updatedAt: new Date(raw.updatedAt),
    }));
  }

  async fetchUpdatedSince(
    kind: "exercises" | "routines",
    since: Date | null,
  ): Promise<Result<unknown[], HttpError>> {
    const url = new URL(`${this.baseUrl}/catalog/${kind}`);
    if (since) {
      url.searchParams.set("updatedSince", since.toISOString());
    }
    return this.get<RawListResponse, unknown[]>(url.toString(), (raw) => raw.items ?? []);
  }

  private async get<TRaw, TMapped>(
    url: string,
    map: (raw: TRaw) => TMapped,
  ): Promise<Result<TMapped, HttpError>> {
    try {
      const raw = await apiClient<TRaw>(url);
      return ok(map(raw));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const statusMatch = /^HTTP (\d+)/.exec(message);
      if (statusMatch?.[1]) {
        return err({ kind: "SERVER_ERROR", status: Number(statusMatch[1]), message });
      }
      return err({ kind: "NETWORK_ERROR", message });
    }
  }
}
