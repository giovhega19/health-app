/**
 * API pública del módulo "sync" (ADR-002, tarea `F01-T08`). Ningún otro
 * módulo debe importar los internos de `sync` (domain/, application/,
 * infrastructure/): solo este archivo (Art. 2.5 de la constitución).
 */
import { EnqueueChange } from "./application/EnqueueChange";
import { PushPendingChanges } from "./application/PushPendingChanges";
import { PullRemoteChanges } from "./application/PullRemoteChanges";
import type { CursorStore, OutboxRepository, SyncEntityApplier, SyncTransportPort } from "./application/ports";

export type {
  CursorStore,
  OutboxRepository,
  PullResult,
  PushResult,
  RemoteChange,
  RepositoryError,
  SyncEntityApplier,
  SyncHttpError,
  SyncTransportPort,
} from "./application/ports";
export type { OutboxEntry, OutboxOp, OutboxStatus } from "./domain/OutboxEntry";

export interface SyncDeps {
  outboxRepository: OutboxRepository;
  transport: SyncTransportPort;
  cursorStore: CursorStore;
  deviceId: string;
  entityAppliers: SyncEntityApplier[];
}

export function createSyncContainer(deps: SyncDeps): {
  enqueueChange: EnqueueChange;
  pushPendingChanges: PushPendingChanges;
  pullRemoteChanges: PullRemoteChanges;
} {
  return {
    enqueueChange: new EnqueueChange(deps.outboxRepository),
    pushPendingChanges: new PushPendingChanges(deps.outboxRepository, deps.transport, deps.deviceId),
    pullRemoteChanges: new PullRemoteChanges(deps.transport, deps.cursorStore, deps.entityAppliers),
  };
}
