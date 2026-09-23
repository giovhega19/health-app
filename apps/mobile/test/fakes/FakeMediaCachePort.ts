import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type {
  LocalUri,
  MediaCacheError,
  MediaCachePort,
  MediaRef,
} from "@/features/catalog/application/ports";

/**
 * Fake en memoria de `MediaCachePort` (`specs/F02-catalogo-propuesta/plan.md`
 * §3). Permite simular "el catálogo y los medios de mis rutinas ya se
 * descargaron" (CA-02.05.1, modo avión) sin tocar el sistema de archivos real
 * ni la política LRU real (bloqueada por ADR-008, ver `plan.md` §7, tarea
 * `F02-T12`): `alreadyCached` se puede precargar en el constructor para
 * representar medios ya descargados en una sesión anterior con conexión.
 */
export class FakeMediaCachePort implements MediaCachePort {
  private readonly alreadyCached: Map<string, LocalUri>;
  /** Se incrementa solo cuando el medio NO estaba ya en caché (simula red). */
  networkFetchCount = 0;
  evictLeastRecentlyUsedCalls: number[] = [];

  constructor(alreadyCached: Record<string, LocalUri> = {}) {
    this.alreadyCached = new Map(Object.entries(alreadyCached));
  }

  async ensureCached(mediaRef: MediaRef): Promise<Result<LocalUri, MediaCacheError>> {
    const cached = this.alreadyCached.get(mediaRef.remoteUrl);
    if (cached) {
      return ok(cached);
    }
    this.networkFetchCount += 1;
    return err({ kind: "NETWORK_UNAVAILABLE" });
  }

  async evictLeastRecentlyUsed(bytesNeeded: number): Promise<void> {
    this.evictLeastRecentlyUsedCalls.push(bytesNeeded);
  }
}
