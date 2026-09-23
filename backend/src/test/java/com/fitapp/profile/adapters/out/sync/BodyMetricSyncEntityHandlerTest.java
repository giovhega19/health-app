package com.fitapp.profile.adapters.out.sync;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.profile.application.FakeBodyMetricRepository;
import com.fitapp.profile.domain.BodyMetric;
import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** {@link BodyMetricSyncEntityHandler} (CA-01.01.1, CA-01.06.1), no database. */
class BodyMetricSyncEntityHandlerTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  private static ObjectMapper newObjectMapper() {
    return new ObjectMapper().findAndRegisterModules();
  }

  @Test
  void supportsTheBodyMetricEntity() {
    var handler =
        new BodyMetricSyncEntityHandler(new FakeBodyMetricRepository(), newObjectMapper());

    assertThat(handler.supportedEntity()).isEqualTo("bodyMetric");
  }

  @Test
  void appliesAValidUpsert() {
    FakeBodyMetricRepository repository = new FakeBodyMetricRepository();
    var handler = new BodyMetricSyncEntityHandler(repository, newObjectMapper());
    UUID userId = UUID.randomUUID();
    UUID changeId = UUID.randomUUID();
    SyncChange change =
        new SyncChange(
            "bodyMetric",
            "upsert",
            changeId,
            Instant.now(FIXED_CLOCK),
            Map.of("date", "2026-09-20", "weightKg", 59.5));

    SyncApplyResult result = handler.apply(userId, change);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findByUserIdAndDate(userId, LocalDate.of(2026, 9, 20)))
        .get()
        .extracting(BodyMetric::weightKg)
        .isEqualTo(59.5);
  }

  @Test
  void replacesTheExistingRowForTheSameDateKeepingItsId_CA0106_1() {
    FakeBodyMetricRepository repository = new FakeBodyMetricRepository();
    UUID userId = UUID.randomUUID();
    UUID existingId = UUID.randomUUID();
    Instant serverUpdatedAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new BodyMetric(existingId, userId, LocalDate.of(2026, 9, 20), 60.0, null, serverUpdatedAt));
    var handler = new BodyMetricSyncEntityHandler(repository, newObjectMapper());
    SyncChange change =
        new SyncChange(
            "bodyMetric",
            "upsert",
            UUID.randomUUID(),
            serverUpdatedAt.plusSeconds(10),
            Map.of("date", "2026-09-20", "weightKg", 59.5));

    handler.apply(userId, change);

    assertThat(repository.findByUserIdAndDate(userId, LocalDate.of(2026, 9, 20)))
        .get()
        .extracting(BodyMetric::id)
        .isEqualTo(existingId);
  }

  @Test
  void anOlderOrEqualChangeIsAcceptedAsANoOp_LWW_RN18() {
    FakeBodyMetricRepository repository = new FakeBodyMetricRepository();
    UUID userId = UUID.randomUUID();
    Instant serverUpdatedAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new BodyMetric(
            UUID.randomUUID(), userId, LocalDate.of(2026, 9, 20), 60.0, null, serverUpdatedAt));
    var handler = new BodyMetricSyncEntityHandler(repository, newObjectMapper());
    SyncChange olderChange =
        new SyncChange(
            "bodyMetric",
            "upsert",
            UUID.randomUUID(),
            serverUpdatedAt.minusSeconds(10),
            Map.of("date", "2026-09-20", "weightKg", 45.0));

    SyncApplyResult result = handler.apply(userId, olderChange);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findByUserIdAndDate(userId, LocalDate.of(2026, 9, 20)))
        .get()
        .extracting(BodyMetric::weightKg)
        .isEqualTo(60.0);
  }

  @Test
  void rejectsAWeightOutOfRange() {
    var handler =
        new BodyMetricSyncEntityHandler(new FakeBodyMetricRepository(), newObjectMapper());
    SyncChange change =
        new SyncChange(
            "bodyMetric",
            "upsert",
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK),
            Map.of("date", "2026-09-20", "weightKg", 5.0));

    SyncApplyResult result = handler.apply(UUID.randomUUID(), change);

    assertThat(result.accepted()).isFalse();
    assertThat(result.rejectionCode()).isEqualTo("VALIDATION_ERROR");
  }

  @Test
  void rejectsAMalformedPayload() {
    var handler =
        new BodyMetricSyncEntityHandler(new FakeBodyMetricRepository(), newObjectMapper());
    SyncChange change =
        new SyncChange(
            "bodyMetric",
            "upsert",
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK),
            Map.of("date", "not-a-date"));

    SyncApplyResult result = handler.apply(UUID.randomUUID(), change);

    assertThat(result.accepted()).isFalse();
  }

  @Test
  void deletingAnExistingEntryRemovesIt() {
    FakeBodyMetricRepository repository = new FakeBodyMetricRepository();
    UUID userId = UUID.randomUUID();
    UUID metricId = UUID.randomUUID();
    Instant createdAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new BodyMetric(metricId, userId, LocalDate.of(2026, 9, 20), 60.0, null, createdAt));
    var handler = new BodyMetricSyncEntityHandler(repository, newObjectMapper());
    SyncChange deleteChange =
        new SyncChange("bodyMetric", "delete", metricId, createdAt.plusSeconds(10), null);

    SyncApplyResult result = handler.apply(userId, deleteChange);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(metricId)).isEmpty();
  }

  @Test
  void deletingAnAlreadyGoneEntryIsIdempotent() {
    var handler =
        new BodyMetricSyncEntityHandler(new FakeBodyMetricRepository(), newObjectMapper());
    SyncChange deleteChange =
        new SyncChange("bodyMetric", "delete", UUID.randomUUID(), Instant.now(FIXED_CLOCK), null);

    SyncApplyResult result = handler.apply(UUID.randomUUID(), deleteChange);

    assertThat(result.accepted()).isTrue();
  }

  @Test
  void pullSinceReturnsEntriesUpdatedAfterTheCursor() {
    FakeBodyMetricRepository repository = new FakeBodyMetricRepository();
    UUID userId = UUID.randomUUID();
    repository.save(
        new BodyMetric(
            UUID.randomUUID(),
            userId,
            LocalDate.of(2026, 1, 1),
            60,
            null,
            Instant.parse("2026-01-01T00:00:00Z")));
    repository.save(
        new BodyMetric(
            UUID.randomUUID(),
            userId,
            LocalDate.of(2026, 2, 1),
            59,
            null,
            Instant.parse("2026-02-01T00:00:00Z")));
    var handler = new BodyMetricSyncEntityHandler(repository, newObjectMapper());

    List<SyncChange> changes =
        handler.pullSince(userId, Instant.parse("2026-01-15T00:00:00Z"), new UUID(0, 0), 500);

    assertThat(changes).hasSize(1);
    assertThat(changes.get(0).entity()).isEqualTo("bodyMetric");
  }
}
