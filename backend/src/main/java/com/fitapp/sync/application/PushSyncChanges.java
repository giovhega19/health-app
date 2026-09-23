package com.fitapp.sync.application;

import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import com.fitapp.sync.domain.SyncEntityHandler;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * `POST /sync/push` use case (CA-01.01.1, CA-01.06.1). Idempotent by construction: every {@link
 * SyncEntityHandler#apply} implementation is an LWW upsert (RN-18, ADR-007), so re-sending the same
 * change (same `Idempotency-Key` retry) yields the same accepted/rejected outcome — no separate
 * idempotency-key store is needed (see the module's plan.md deviation notes).
 */
@Component
public class PushSyncChanges {

  private final Map<String, SyncEntityHandler> handlersByEntity;
  private final Clock clock;

  public PushSyncChanges(List<SyncEntityHandler> handlers, Clock clock) {
    this.handlersByEntity =
        handlers.stream()
            .collect(Collectors.toMap(SyncEntityHandler::supportedEntity, Function.identity()));
    this.clock = clock;
  }

  public PushResult execute(UUID userId, List<SyncChange> changes) {
    List<UUID> accepted = new ArrayList<>();
    List<SyncRejection> rejected = new ArrayList<>();
    for (SyncChange change : changes) {
      SyncEntityHandler handler = handlersByEntity.get(change.entity());
      if (handler == null) {
        rejected.add(
            new SyncRejection(
                change.id(),
                "UNSUPPORTED_ENTITY",
                "Entity '" + change.entity() + "' is not supported."));
        continue;
      }
      SyncApplyResult result = handler.apply(userId, change);
      if (result.accepted()) {
        accepted.add(change.id());
      } else {
        rejected.add(
            new SyncRejection(change.id(), result.rejectionCode(), result.rejectionDetail()));
      }
    }
    return new PushResult(accepted, rejected, clock.instant());
  }
}
