package com.fitapp.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fitapp.identity.domain.InvalidCredentialsException;
import com.fitapp.identity.domain.User;
import com.fitapp.identity.domain.events.AccountDeleted;
import com.fitapp.profile.adapters.in.event.AccountDeletedListener;
import com.fitapp.profile.application.FakeBodyMetricRepository;
import com.fitapp.profile.application.FakeProfileRepository;
import com.fitapp.profile.application.PurgeProfileData;
import com.fitapp.profile.domain.ProfileSnapshot;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

/**
 * CA-01.08.1 (`specs/F01-perfil-onboarding/spec.md`, backend part): "elijo 'Eliminar cuenta' y
 * confirmo... se llama a DELETE /me... y al intentar iniciar sesión con esas credenciales recibo
 * 'credenciales inválidas'".
 */
class DeleteAccountTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  /** No-op publisher for tests that don't care about the {@code AccountDeleted} event. */
  private static final ApplicationEventPublisher NO_OP_PUBLISHER = event -> {};

  @Test
  void softDeletesTheUserAndRevokesAllRefreshTokens() {
    UUID userId = UUID.randomUUID();
    FakeUserRepository userRepository = new FakeUserRepository();
    userRepository.seed(
        new User(userId, "ana@fitapp.test", "hash", "1.0", true, Instant.now(FIXED_CLOCK), null));
    FakeRefreshTokenRepository refreshTokenRepository = new FakeRefreshTokenRepository();
    DeleteAccount useCase =
        new DeleteAccount(userRepository, refreshTokenRepository, NO_OP_PUBLISHER, FIXED_CLOCK);

    assertThatCode(() -> useCase.execute(userId)).doesNotThrowAnyException();

    assertThat(userRepository.findById(userId)).get().extracting(User::isDeleted).isEqualTo(true);
    assertThat(refreshTokenRepository.revokedUserIds()).contains(userId);
  }

  @Test
  void afterDeletionLoggingInWithTheSameCredentialsIsRejectedAsInvalid_CA0108_1() {
    UUID userId = UUID.randomUUID();
    FakePasswordHasher passwordHasher = new FakePasswordHasher();
    FakeUserRepository userRepository = new FakeUserRepository();
    userRepository.seed(
        new User(
            userId,
            "ana@fitapp.test",
            passwordHasher.hash("Sup3rSecret!"),
            "1.0",
            true,
            Instant.now(FIXED_CLOCK),
            null));
    FakeRefreshTokenRepository refreshTokenRepository = new FakeRefreshTokenRepository();
    DeleteAccount deleteAccount =
        new DeleteAccount(userRepository, refreshTokenRepository, NO_OP_PUBLISHER, FIXED_CLOCK);
    LoginUser loginUser = new LoginUser(userRepository, passwordHasher);

    assertThatCode(() -> deleteAccount.execute(userId)).doesNotThrowAnyException();

    assertThatThrownBy(
            () -> loginUser.execute(new LoginUserCommand("ana@fitapp.test", "Sup3rSecret!")))
        .isInstanceOf(InvalidCredentialsException.class);
  }

  @Test
  void publishesAnAccountDeletedEventWithTheDeletedUserId() {
    UUID userId = UUID.randomUUID();
    FakeUserRepository userRepository = new FakeUserRepository();
    userRepository.seed(
        new User(userId, "ana@fitapp.test", "hash", "1.0", true, Instant.now(FIXED_CLOCK), null));
    List<Object> publishedEvents = new ArrayList<>();
    DeleteAccount useCase =
        new DeleteAccount(
            userRepository, new FakeRefreshTokenRepository(), publishedEvents::add, FIXED_CLOCK);

    useCase.execute(userId);

    assertThat(publishedEvents)
        .singleElement()
        .isEqualTo(new AccountDeleted(userId, Instant.now(FIXED_CLOCK)));
  }

  /**
   * C1 (security review, H1): `DELETE /me` must also delete the user's health data in `profile`
   * (`profile_profiles`/`profile_body_metrics`), not just soft-delete `identity_users` — Art. 5.4
   * of 00-constitucion.md, RNF-08 (Ley 1581 right of erasure). This test wires `identity`'s {@code
   * DeleteAccount} straight to `profile`'s real {@code AccountDeletedListener} through a real
   * (synchronous, in-process) {@link ApplicationEventPublisher}, exactly as Spring does at runtime
   * (plain {@code @EventListener}, not async), to prove the cross-module contract end to end
   * without needing a full Spring context.
   */
  @Test
  void deletingAnAccountAlsoDeletesTheUsersProfileDataInAnotherModule() {
    UUID userId = UUID.randomUUID();
    FakeUserRepository userRepository = new FakeUserRepository();
    userRepository.seed(
        new User(userId, "ana@fitapp.test", "hash", "1.0", true, Instant.now(FIXED_CLOCK), null));
    FakeProfileRepository profileRepository = new FakeProfileRepository();
    FakeBodyMetricRepository bodyMetricRepository = new FakeBodyMetricRepository();
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
            Instant.now(FIXED_CLOCK),
            Instant.now(FIXED_CLOCK)));
    AccountDeletedListener profileListener =
        new AccountDeletedListener(new PurgeProfileData(profileRepository, bodyMetricRepository));
    ApplicationEventPublisher publisher =
        event -> {
          if (event instanceof AccountDeleted accountDeleted) {
            profileListener.on(accountDeleted);
          }
        };
    DeleteAccount useCase =
        new DeleteAccount(userRepository, new FakeRefreshTokenRepository(), publisher, FIXED_CLOCK);

    useCase.execute(userId);

    assertThat(profileRepository.findByUserId(userId)).isEmpty();
  }
}
