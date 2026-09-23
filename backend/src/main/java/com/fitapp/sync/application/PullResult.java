package com.fitapp.sync.application;

import com.fitapp.sync.domain.SyncChange;
import java.util.List;

/** Output of {@link PullSyncChanges}, mirrors `SyncPullResponse`. */
public record PullResult(List<SyncChange> changes, String nextCursor, boolean hasMore) {}
