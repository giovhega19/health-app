import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { PullResult, PushResult, RemoteChange, SyncHttpError, SyncTransportPort } from "@/features/sync";

/** Fake en memoria de `SyncTransportPort` (`features/sync/application/ports.ts`). */
export class FakeSyncTransportPort implements SyncTransportPort {
  pushedBatches: RemoteChange[][] = [];
  nextPushResult: Result<PushResult, SyncHttpError> | null = null;
  nextPullResult: Result<PullResult, SyncHttpError> | null = null;

  async push(_deviceId: string, changes: RemoteChange[]) {
    this.pushedBatches.push(changes);
    return (
      this.nextPushResult ??
      ok({ accepted: changes.map((change) => change.id), rejected: [], serverTime: "2026-09-22T10:00:00Z" })
    );
  }

  async pull(_cursor: string | null) {
    return this.nextPullResult ?? ok({ changes: [], nextCursor: null, hasMore: false });
  }
}
