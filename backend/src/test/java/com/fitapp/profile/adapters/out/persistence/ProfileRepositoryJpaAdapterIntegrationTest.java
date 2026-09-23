package com.fitapp.profile.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.PostgresTestContainer;
import com.fitapp.profile.domain.BodyMetric;
import com.fitapp.profile.domain.BodyMetricRepository;
import com.fitapp.profile.domain.ProfileRepository;
import com.fitapp.profile.domain.ProfileSnapshot;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real-database integration test for the `profile` module's JPA adapters
 * (`db/migration/profile/V2__*.sql`), analogous to {@code identity}'s. Covers the upsert-by-userId
 * (profile) and upsert-by-(userId,date) (body metric, CA-01.06.1) semantics against a real
 * PostgreSQL container.
 */
@SpringBootTest
@Transactional
class ProfileRepositoryJpaAdapterIntegrationTest extends PostgresTestContainer {

  @Autowired private ProfileRepository profileRepository;
  @Autowired private BodyMetricRepository bodyMetricRepository;

  @Test
  void savesAndReloadsAProfileWithEquipmentList() {
    UUID userId = UUID.randomUUID();
    ProfileSnapshot snapshot =
        new ProfileSnapshot(
            UUID.randomUUID(),
            userId,
            LocalDate.of(1996, 1, 1),
            "FEMALE",
            165.0,
            "GENERAL_HEALTH",
            "BEGINNER",
            3,
            30,
            List.of("NONE", "DUMBBELLS"),
            "METRIC",
            60.0,
            false,
            Instant.now(),
            Instant.now());

    profileRepository.save(snapshot);

    ProfileSnapshot reloaded = profileRepository.findByUserId(userId).orElseThrow();
    assertThat(reloaded.equipment()).containsExactly("NONE", "DUMBBELLS");
    assertThat(reloaded.heightCm()).isEqualTo(165.0);
  }

  @Test
  void appendingABodyMetricTwiceForTheSameDateUpserts_CA0106_1() {
    UUID userId = UUID.randomUUID();
    LocalDate today = LocalDate.of(2026, 9, 22);
    BodyMetric first = new BodyMetric(UUID.randomUUID(), userId, today, 60.0, null, Instant.now());

    BodyMetric saved = bodyMetricRepository.save(first);
    BodyMetric replacement =
        new BodyMetric(saved.id(), userId, today, 59.5, null, Instant.now().plusSeconds(1));
    // Simulate AppendBodyMetric's upsert-by-date lookup.
    UUID existingId = bodyMetricRepository.findByUserIdAndDate(userId, today).orElseThrow().id();
    bodyMetricRepository.save(
        new BodyMetric(existingId, userId, today, 59.5, null, replacement.updatedAt()));

    List<BodyMetric> history = bodyMetricRepository.findByUserIdAndRange(userId, null, null);
    assertThat(history).hasSize(1);
    assertThat(history.get(0).weightKg()).isEqualTo(59.5);
  }

  /**
   * C1 (security review, H1): backs {@code PurgeProfileData}, triggered when `identity` publishes
   * {@code AccountDeleted} (Art. 5.4 of 00-constitucion.md). Real-DB proof that the
   * {@code @Modifying} bulk-delete query actually removes the row.
   */
  @Test
  void deleteByUserIdRemovesTheProfileRow_C1() {
    UUID userId = UUID.randomUUID();
    profileRepository.save(
        new ProfileSnapshot(
            UUID.randomUUID(),
            userId,
            LocalDate.of(1996, 1, 1),
            "FEMALE",
            165.0,
            "GENERAL_HEALTH",
            "BEGINNER",
            3,
            30,
            List.of("NONE"),
            "METRIC",
            null,
            true,
            Instant.now(),
            Instant.now()));

    profileRepository.deleteByUserId(userId);

    assertThat(profileRepository.findByUserId(userId)).isEmpty();
  }

  /** C1 (security review, H1), see {@link #deleteByUserIdRemovesTheProfileRow_C1()}. */
  @Test
  void deleteByUserIdRemovesEveryBodyMetricRowOfTheUser_C1() {
    UUID userId = UUID.randomUUID();
    bodyMetricRepository.save(
        new BodyMetric(UUID.randomUUID(), userId, LocalDate.now(), 60.0, null, Instant.now()));
    bodyMetricRepository.save(
        new BodyMetric(
            UUID.randomUUID(), userId, LocalDate.now().minusDays(1), 61.0, null, Instant.now()));
    UUID otherUserId = UUID.randomUUID();
    bodyMetricRepository.save(
        new BodyMetric(UUID.randomUUID(), otherUserId, LocalDate.now(), 70.0, null, Instant.now()));

    bodyMetricRepository.deleteByUserId(userId);

    assertThat(bodyMetricRepository.findByUserIdAndRange(userId, null, null)).isEmpty();
    assertThat(bodyMetricRepository.findByUserIdAndRange(otherUserId, null, null)).hasSize(1);
  }
}
