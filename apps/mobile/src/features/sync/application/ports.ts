import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { OutboxEntry, OutboxOp } from "../domain/OutboxEntry";

/**
 * Puertos de `sync/application` (ADR-002, `specs/F01-perfil-onboarding/plan.md`
 * §3/§4, tarea `F01-T08`).
 */
export interface RepositoryError {
  kind: "NOT_FOUND" | "STORAGE_ERROR" | "UNKNOWN";
  message?: string;
}

export interface OutboxRepository {
  enqueue(
    entity: string,
    op: OutboxOp,
    entityId: Id,
    payload: Record<string, unknown> | null,
  ): Promise<Result<void, RepositoryError>>;
  pending(): Promise<Result<OutboxEntry[], RepositoryError>>;
  markSent(ids: Id[]): Promise<Result<void, RepositoryError>>;
  markFailed(id: Id, reason: string): Promise<Result<void, RepositoryError>>;
  clear(): Promise<Result<void, RepositoryError>>;
}

export interface RemoteChange {
  entity: string;
  op: OutboxOp;
  id: string;
  updatedAt: string;
  data?: Record<string, unknown>;
}

export interface PushResult {
  accepted: string[];
  rejected: { id: string; code: string; detail?: string }[];
  serverTime: string;
}

export interface PullResult {
  changes: RemoteChange[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type SyncHttpError = { kind: "NETWORK_ERROR"; message?: string } | { kind: "SERVER_ERROR"; status?: number };

export interface SyncTransportPort {
  push(deviceId: string, changes: RemoteChange[]): Promise<Result<PushResult, SyncHttpError>>;
  pull(cursor: string | null): Promise<Result<PullResult, SyncHttpError>>;
}

/**
 * SPI que cada feature consumidora de `sync` implementa para aplicar los
 * cambios remotos recibidos por `GET /sync/pull` a su propio almacenamiento
 * local (`plan.md` §3, réplica en TypeScript del `SyncEntityHandler`
 * backend). En H1 solo `profile` la implementa, para `entity ∈ {profile,
 * bodyMetric}`.
 */
export interface SyncEntityApplier {
  supports(entity: string): boolean;
  apply(change: RemoteChange): Promise<Result<void, RepositoryError>>;
}

export interface CursorStore {
  load(): Promise<string | null>;
  save(cursor: string | null): Promise<void>;
}
