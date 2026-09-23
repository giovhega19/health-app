package com.fitapp;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.identity.application.DeleteAccount;
import com.fitapp.identity.domain.User;
import com.fitapp.identity.domain.UserRepository;
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
 * C1 (security review, H1): `DELETE /me` must delete the user's health data, not just soft-delete
 * {@code identity_users} (Art. 5.4 of 00-constitucion.md, RNF-08 — Ley 1581 right of erasure). This
 * is the full-stack proof, wiring the real Spring context (real {@code ApplicationEventPublisher},
 * real {@code AccountDeletedListener} bean, real PostgreSQL via Testcontainers): after {@code
 * DeleteAccount.execute()}, no row remains in {@code profile_profiles}/{@code profile_body_metrics}
 * for that {@code userId}.
 *
 * <p>Complements the fast, DB-less composition test in {@code
 * identity.application.DeleteAccountTest} (manually wires `identity` -> `profile`'s listener) by
 * additionally proving the *actual* Spring `@EventListener` registration/wiring works end to end —
 * a misconfigured `@Component`/event type would not be caught by the DB-less test.
 */
@SpringBootTest
@Transactional
class AccountDeletionIntegrationTest extends PostgresTestContainer {

  @Autowired private DeleteAccount deleteAccount;
  @Autowired private UserRepository userRepository;
  @Autowired private ProfileRepository profileRepository;
  @Autowired private BodyMetricRepository bodyMetricRepository;

  @Test
  void deletingAnAccountAlsoDeletesTheUsersProfileDataAndBodyMetrics() {
    UUID userId = UUID.randomUUID();
    userRepository.save(
        new User(userId, "delete-me@fitapp.test", "hash", "1.0", true, Instant.now(), null));
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
            true, // parq_flagged: sensitive health data, must be gone too
            Instant.now(),
            Instant.now()));
    bodyMetricRepository.save(
        new BodyMetric(UUID.randomUUID(), userId, LocalDate.now(), 60.0, 80.0, Instant.now()));

    deleteAccount.execute(userId);

    assertThat(profileRepository.findByUserId(userId)).isEmpty();
    assertThat(bodyMetricRepository.findByUserIdAndRange(userId, null, null)).isEmpty();
  }
}
