package com.fitapp.sync.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.sync.domain.SyncChange;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** `POST /sync/push` (CA-01.01.1, CA-01.06.1). */
class PushSyncChangesTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  @Test
  void acceptsAChangeForASupportedEntity() {
    FakeSyncEntityHandler handler = new FakeSyncEntityHandler("profile");
    PushSyncChanges useCase = new PushSyncChanges(List.of(handler), FIXED_CLOCK);
    UUID changeId = UUID.randomUUID();

    PushResult result =
        useCase.execute(
            UUID.randomUUID(),
            List.of(
                new SyncChange("profile", "upsert", changeId, Instant.now(FIXED_CLOCK), Map.of())));

    assertThat(result.accepted()).containsExactly(changeId);
    assertThat(result.rejected()).isEmpty();
  }

  @Test
  void rejectsAChangeForAnUnsupportedEntity_UNSUPPORTED_ENTITY() {
    PushSyncChanges useCase = new PushSyncChanges(List.of(), FIXED_CLOCK);
    UUID changeId = UUID.randomUUID();

    PushResult result =
        useCase.execute(
            UUID.randomUUID(),
            List.of(
                new SyncChange("routine", "upsert", changeId, Instant.now(FIXED_CLOCK), Map.of())));

    assertThat(result.rejected()).hasSize(1);
    assertThat(result.rejected().get(0).code()).isEqualTo("UNSUPPORTED_ENTITY");
  }

  @Test
  void propagatesTheHandlersRejection() {
    FakeSyncEntityHandler handler = new FakeSyncEntityHandler("bodyMetric");
    handler.rejectNextApply();
    PushSyncChanges useCase = new PushSyncChanges(List.of(handler), FIXED_CLOCK);
    UUID changeId = UUID.randomUUID();

    PushResult result =
        useCase.execute(
            UUID.randomUUID(),
            List.of(
                new SyncChange(
                    "bodyMetric", "upsert", changeId, Instant.now(FIXED_CLOCK), Map.of())));

    assertThat(result.accepted()).isEmpty();
    assertThat(result.rejected()).hasSize(1);
    assertThat(result.rejected().get(0).code()).isEqualTo("VALIDATION_ERROR");
  }
}
