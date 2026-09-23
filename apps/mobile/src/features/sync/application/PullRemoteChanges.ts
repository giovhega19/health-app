import { isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { CursorStore, RepositoryError, SyncEntityApplier, SyncHttpError, SyncTransportPort } from "./ports";

/**
 * `PullRemoteChanges` (ADR-002/CA-01.01.1, tarea `F01-T08`): trae cambios
 * remotos (`GET /sync/pull?cursor=`) y los aplica localmente vía los
 * `SyncEntityApplier` registrados (uno por `entity`, patrón SPI igual al
 * `SyncEntityHandler` del backend). Avanza el cursor solo si se aplicaron
 * todos los cambios de la página.
 */
export interface PullRemoteChangesResult {
  applied: number;
  hasMore: boolean;
}

export type PullRemoteChangesError = RepositoryError | SyncHttpError | { kind: "UNSUPPORTED_ENTITY"; entity: string };

export class PullRemoteChanges {
  constructor(
    private readonly transport: SyncTransportPort,
    private readonly cursorStore: CursorStore,
    private readonly appliers: SyncEntityApplier[],
  ) {}

  async execute(): Promise<Result<PullRemoteChangesResult, PullRemoteChangesError>> {
    const cursor = await this.cursorStore.load();
    const pullResult = await this.transport.pull(cursor);
    if (!isOk(pullResult)) {
      return pullResult;
    }

    let applied = 0;
    for (const change of pullResult.value.changes) {
      const applier = this.appliers.find((candidate) => candidate.supports(change.entity));
      if (!applier) {
        // Igual que el backend (`UNSUPPORTED_ENTITY`), un cambio de una
        // entidad sin handler local no debe tumbar toda la sincronización:
        // se ignora y se sigue con el resto (extensible sin tocar `sync`).
        continue;
      }
      const applyResult = await applier.apply(change);
      if (!isOk(applyResult)) {
        return applyResult;
      }
      applied += 1;
    }

    await this.cursorStore.save(pullResult.value.nextCursor);

    return ok({ applied, hasMore: pullResult.value.hasMore });
  }
}
