import { isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { LocalUri, MediaCacheError, MediaCachePort, MediaRef } from "./ports";

/**
 * `EnsureOfflineMedia` (CA-02.05.1, tarea `F02-T09`/`F02-T12`). Resuelve las
 * URIs locales de una lista de medios sin depender de la red cuando ya están
 * en caché (modo avión).
 */
export class EnsureOfflineMedia {
  constructor(private readonly mediaCache: MediaCachePort) {}

  async execute(refs: MediaRef[]): Promise<Result<LocalUri[], MediaCacheError>> {
    const uris: LocalUri[] = [];
    for (const ref of refs) {
      const result = await this.mediaCache.ensureCached(ref);
      if (!isOk(result)) {
        return result;
      }
      uris.push(result.value);
    }
    return ok(uris);
  }
}
