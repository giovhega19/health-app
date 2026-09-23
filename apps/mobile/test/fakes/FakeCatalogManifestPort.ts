import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type {
  CatalogManifest,
  CatalogManifestPort,
  HttpError,
} from "@/features/catalog/application/ports";

export type FetchUpdatedSinceCall = { kind: "exercises" | "routines"; since: Date | null };

/**
 * Fake en memoria de `CatalogManifestPort` (`specs/F02-catalogo-propuesta/plan.md`
 * §3). Sustituye a `HttpCatalogAdapter` en pruebas de aplicación (CA-02.06.1):
 * sin red real (07-estrategia-pruebas.md §2.3).
 */
export class FakeCatalogManifestPort implements CatalogManifestPort {
  readonly fetchUpdatedSinceCalls: FetchUpdatedSinceCall[] = [];
  manifestResult: Result<CatalogManifest, HttpError> = ok({
    version: 1,
    exercisesEtag: "etag-exercises-v1",
    routinesEtag: "etag-routines-v1",
    mediaBaseUrl: "https://cdn.fitapp.test/",
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });
  updatedSinceResults: Partial<Record<"exercises" | "routines", Result<unknown[], HttpError>>> = {
    exercises: ok([]),
    routines: ok([]),
  };

  async fetchManifest(): Promise<Result<CatalogManifest, HttpError>> {
    return this.manifestResult;
  }

  async fetchUpdatedSince(
    kind: "exercises" | "routines",
    since: Date | null,
  ): Promise<Result<unknown[], HttpError>> {
    this.fetchUpdatedSinceCalls.push({ kind, since });
    return this.updatedSinceResults[kind] ?? ok([]);
  }
}
