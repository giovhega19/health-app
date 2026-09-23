package com.fitapp.sync.application;

import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import com.fitapp.sync.domain.SyncEntityHandler;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** In-memory fake of {@link SyncEntityHandler} for one arbitrary entity name. */
public class FakeSyncEntityHandler implements SyncEntityHandler {

  private final String entity;
  private final List<SyncChange> stored = new ArrayList<>();
  private boolean rejectNext;

  public FakeSyncEntityHandler(String entity) {
    this.entity = entity;
  }

  public void rejectNextApply() {
    this.rejectNext = true;
  }

  @Override
  public String supportedEntity() {
    return entity;
  }

  @Override
  public SyncApplyResult apply(UUID userId, SyncChange change) {
    if (rejectNext) {
      rejectNext = false;
      return SyncApplyResult.rejected("VALIDATION_ERROR", "rejected by fake");
    }
    stored.removeIf(existing -> existing.id().equals(change.id()));
    stored.add(change);
    return SyncApplyResult.ok();
  }

  @Override
  public List<SyncChange> pullSince(UUID userId, Instant since, UUID sinceId, int limit) {
    return stored.stream()
        .filter(
            change ->
                change.updatedAt().isAfter(since)
                    || change.updatedAt().equals(since) && change.id().compareTo(sinceId) > 0)
        .sorted((a, b) -> a.updatedAt().compareTo(b.updatedAt()))
        .limit(limit)
        .toList();
  }
}
