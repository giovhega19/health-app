import { isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { OutboxEntry } from "../domain/OutboxEntry";
import type { OutboxRepository, RemoteChange, RepositoryError, SyncHttpError, SyncTransportPort } from "./ports";

/**
 * `PushPendingChanges` (ADR-002/CA-01.01.1/CA-01.06.1, tarea `F01-T08`): lee
 * las entradas `pending` del `outbox` y las envía a `POST /sync/push`
 * (`SyncTransportPort`). Marca como `sent` las aceptadas y como `failed`
 * (con motivo) las rechazadas, sin bloquear la UI (Art. 7, offline-first): si
 * no hay conexión, el `outbox` simplemente sigue creciendo y se reintenta
 * más tarde.
 */
export interface PushPendingChangesResult {
  pushed: number;
  rejected: number;
}

export type PushPendingChangesError = RepositoryError | SyncHttpError;

export class PushPendingChanges {
  constructor(
    private readonly outbox: OutboxRepository,
    private readonly transport: SyncTransportPort,
    private readonly deviceId: string,
  ) {}

  async execute(): Promise<Result<PushPendingChangesResult, PushPendingChangesError>> {
    const pendingResult = await this.outbox.pending();
    if (!isOk(pendingResult)) {
      return pendingResult;
    }
    const pending = pendingResult.value;
    if (pending.length === 0) {
      return ok({ pushed: 0, rejected: 0 });
    }

    const changes = pending.map(toRemoteChange);
    const pushResult = await this.transport.push(this.deviceId, changes);
    if (!isOk(pushResult)) {
      return pushResult;
    }

    // `accepted`/`rejected` del servidor identifican el `SyncChange` por
    // `entityId` (el id del dato de dominio, `06-contratos-api.md` §"sync"),
    // no por el id de la fila de `outbox`: se mapea explícitamente entre
    // ambos en vez de asumir que coinciden.
    const { accepted, rejected } = pushResult.value;
    const acceptedIds = pending.filter((entry) => accepted.includes(entry.entityId)).map((entry) => entry.id);
    if (acceptedIds.length > 0) {
      await this.outbox.markSent(acceptedIds);
    }
    for (const rejection of rejected) {
      const entry = pending.find((candidate) => candidate.entityId === rejection.id);
      if (entry) {
        await this.outbox.markFailed(entry.id, rejection.detail ?? rejection.code);
      }
    }

    return ok({ pushed: acceptedIds.length, rejected: rejected.length });
  }
}

function toRemoteChange(entry: OutboxEntry): RemoteChange {
  return {
    entity: entry.entity,
    op: entry.op,
    id: entry.entityId,
    updatedAt: entry.createdAt.toISOString(),
    data: entry.payload ?? undefined,
  };
}
