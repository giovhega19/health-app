package com.fitapp.sync.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Output of {@link PushSyncChanges}, mirrors `SyncPushResponse`. */
public record PushResult(List<UUID> accepted, List<SyncRejection> rejected, Instant serverTime) {}
