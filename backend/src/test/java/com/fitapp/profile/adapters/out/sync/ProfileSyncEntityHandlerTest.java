package com.fitapp.profile.adapters.out.sync;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.profile.application.FakeProfileRepository;
import com.fitapp.profile.domain.ProfileSnapshot;
import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * {@link ProfileSyncEntityHandler} (CA-01.01.1), no database: uses {@link FakeProfileRepository}.
 */
class ProfileSyncEntityHandlerTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  // Production wires the Spring-managed ObjectMapper (auto-configured with the JSR-310 module for
  // LocalDate/Instant); a bare `newObjectMapper()` does not register it, so tests do it manually.
  private static ObjectMapper newObjectMapper() {
    return new ObjectMapper().findAndRegisterModules();
  }

  private static Map<String, Object> validPayload() {
    return Map.of(
        "birthDate",
        "1996-01-01",
        "gender",
        "FEMALE",
        "heightCm",
        165.0,
        "goal",
        "GENERAL_HEALTH",
        "level",
        "BEGINNER",
        "daysPerWeek",
        3,
        "minutesPerSession",
        30,
        "equipment",
        List.of("NONE"),
        "unitSystem",
        "METRIC",
        "parqFlagged",
        false);
  }

  @Test
  void supportsTheProfileEntity() {
    var handler =
        new ProfileSyncEntityHandler(new FakeProfileRepository(), newObjectMapper(), FIXED_CLOCK);

    assertThat(handler.supportedEntity()).isEqualTo("profile");
  }

  @Test
  void appliesAValidUpsertWhenThereIsNoExistingProfile() {
    FakeProfileRepository repository = new FakeProfileRepository();
    var handler = new ProfileSyncEntityHandler(repository, newObjectMapper(), FIXED_CLOCK);
    UUID userId = UUID.randomUUID();
    SyncChange change =
        new SyncChange(
            "profile", "upsert", UUID.randomUUID(), Instant.now(FIXED_CLOCK), validPayload());

    SyncApplyResult result = handler.apply(userId, change);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findByUserId(userId)).isPresent();
  }

  @Test
  void anOlderOrEqualChangeIsAcceptedAsANoOp_LWW_RN18() {
    FakeProfileRepository repository = new FakeProfileRepository();
    UUID userId = UUID.randomUUID();
    Instant serverUpdatedAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new ProfileSnapshot(
            UUID.randomUUID(),
            userId,
            java.time.LocalDate.of(1990, 1, 1),
            "MALE",
            180,
            "STRENGTH",
            "ADVANCED",
            4,
            60,
            List.of(),
            "METRIC",
            null,
            false,
            serverUpdatedAt,
            serverUpdatedAt));
    var handler = new ProfileSyncEntityHandler(repository, newObjectMapper(), FIXED_CLOCK);
    SyncChange olderChange =
        new SyncChange(
            "profile",
            "upsert",
            UUID.randomUUID(),
            serverUpdatedAt.minusSeconds(10),
            validPayload());

    SyncApplyResult result = handler.apply(userId, olderChange);

    assertThat(result.accepted()).isTrue();
    // Untouched: still the original MALE/STRENGTH profile, not the incoming FEMALE payload.
    assertThat(repository.findByUserId(userId))
        .get()
        .extracting(ProfileSnapshot::gender)
        .isEqualTo("MALE");
  }

  @Test
  void rejectsAnAgeBelowTheMinimum() {
    var handler =
        new ProfileSyncEntityHandler(new FakeProfileRepository(), newObjectMapper(), FIXED_CLOCK);
    Map<String, Object> payload = new java.util.HashMap<>(validPayload());
    payload.put("birthDate", "2020-01-01");
    SyncChange change =
        new SyncChange("profile", "upsert", UUID.randomUUID(), Instant.now(FIXED_CLOCK), payload);

    SyncApplyResult result = handler.apply(UUID.randomUUID(), change);

    assertThat(result.accepted()).isFalse();
    assertThat(result.rejectionCode()).isEqualTo("AGE_BELOW_MINIMUM");
  }

  @Test
  void rejectsAMalformedPayload() {
    var handler =
        new ProfileSyncEntityHandler(new FakeProfileRepository(), newObjectMapper(), FIXED_CLOCK);
    SyncChange change =
        new SyncChange(
            "profile",
            "upsert",
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK),
            Map.of("birthDate", "not-a-date"));

    SyncApplyResult result = handler.apply(UUID.randomUUID(), change);

    assertThat(result.accepted()).isFalse();
    assertThat(result.rejectionCode()).isEqualTo("VALIDATION_ERROR");
  }

  @Test
  void rejectsADeleteOperationOnTheProfileEntity() {
    var handler =
        new ProfileSyncEntityHandler(new FakeProfileRepository(), newObjectMapper(), FIXED_CLOCK);
    SyncChange change =
        new SyncChange("profile", "delete", UUID.randomUUID(), Instant.now(FIXED_CLOCK), null);

    SyncApplyResult result = handler.apply(UUID.randomUUID(), change);

    assertThat(result.accepted()).isFalse();
    assertThat(result.rejectionCode()).isEqualTo("VALIDATION_ERROR");
  }

  @Test
  void pullSinceReturnsTheProfileWhenItIsNewerThanTheCursor() {
    FakeProfileRepository repository = new FakeProfileRepository();
    UUID userId = UUID.randomUUID();
    Instant updatedAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new ProfileSnapshot(
            UUID.randomUUID(),
            userId,
            java.time.LocalDate.of(1990, 1, 1),
            "MALE",
            180,
            "STRENGTH",
            "ADVANCED",
            4,
            60,
            List.of(),
            "METRIC",
            null,
            false,
            updatedAt,
            updatedAt));
    var handler = new ProfileSyncEntityHandler(repository, newObjectMapper(), FIXED_CLOCK);

    List<SyncChange> changes =
        handler.pullSince(userId, updatedAt.minusSeconds(10), new UUID(0, 0), 500);

    assertThat(changes).hasSize(1);
    assertThat(changes.get(0).entity()).isEqualTo("profile");
  }

  @Test
  void pullSinceReturnsNothingWhenTheUserHasNoProfile() {
    var handler =
        new ProfileSyncEntityHandler(new FakeProfileRepository(), newObjectMapper(), FIXED_CLOCK);

    assertThat(handler.pullSince(UUID.randomUUID(), Instant.EPOCH, new UUID(0, 0), 500)).isEmpty();
  }
}
