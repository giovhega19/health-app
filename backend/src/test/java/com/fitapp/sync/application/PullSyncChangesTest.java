package com.fitapp.sync.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.sync.domain.SyncChange;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** `GET /sync/pull?cursor=&limit=` (CA-01.01.1). */
class PullSyncChangesTest {

  @Test
  void returnsEveryChangeFromTheBeginningWhenThereIsNoCursor() {
    FakeSyncEntityHandler profileHandler = new FakeSyncEntityHandler("profile");
    UUID userId = UUID.randomUUID();
    profileHandler.apply(
        userId,
        new SyncChange(
            "profile",
            "upsert",
            UUID.randomUUID(),
            Instant.parse("2026-01-01T00:00:00Z"),
            Map.of()));
    PullSyncChanges useCase = new PullSyncChanges(List.of(profileHandler));

    PullResult result = useCase.execute(userId, null, 500);

    assertThat(result.changes()).hasSize(1);
    assertThat(result.hasMore()).isFalse();
  }

  @Test
  void mergesChangesFromMultipleHandlersOrderedByUpdatedAt() {
    FakeSyncEntityHandler profileHandler = new FakeSyncEntityHandler("profile");
    FakeSyncEntityHandler bodyMetricHandler = new FakeSyncEntityHandler("bodyMetric");
    UUID userId = UUID.randomUUID();
    profileHandler.apply(
        userId,
        new SyncChange(
            "profile",
            "upsert",
            UUID.randomUUID(),
            Instant.parse("2026-02-01T00:00:00Z"),
            Map.of()));
    bodyMetricHandler.apply(
        userId,
        new SyncChange(
            "bodyMetric",
            "upsert",
            UUID.randomUUID(),
            Instant.parse("2026-01-01T00:00:00Z"),
            Map.of()));
    PullSyncChanges useCase = new PullSyncChanges(List.of(profileHandler, bodyMetricHandler));

    PullResult result = useCase.execute(userId, null, 500);

    assertThat(result.changes()).hasSize(2);
    assertThat(result.changes().get(0).entity()).isEqualTo("bodyMetric");
    assertThat(result.changes().get(1).entity()).isEqualTo("profile");
  }

  @Test
  void paginatesWithAHasMoreFlagAndAUsableNextCursor() {
    FakeSyncEntityHandler handler = new FakeSyncEntityHandler("profile");
    UUID userId = UUID.randomUUID();
    handler.apply(
        userId,
        new SyncChange(
            "profile",
            "upsert",
            UUID.randomUUID(),
            Instant.parse("2026-01-01T00:00:00Z"),
            Map.of()));
    handler.apply(
        userId,
        new SyncChange(
            "profile",
            "upsert",
            UUID.randomUUID(),
            Instant.parse("2026-01-02T00:00:00Z"),
            Map.of()));
    PullSyncChanges useCase = new PullSyncChanges(List.of(handler));

    PullResult firstPage = useCase.execute(userId, null, 1);

    assertThat(firstPage.changes()).hasSize(1);
    assertThat(firstPage.hasMore()).isTrue();

    PullResult secondPage = useCase.execute(userId, firstPage.nextCursor(), 1);

    assertThat(secondPage.changes()).hasSize(1);
    assertThat(secondPage.hasMore()).isFalse();
  }
}
