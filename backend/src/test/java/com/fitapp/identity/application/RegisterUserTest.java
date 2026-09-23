package com.fitapp.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fitapp.identity.domain.EmailAlreadyRegisteredException;
import com.fitapp.identity.domain.HealthConsentRequiredException;
import com.fitapp.identity.domain.User;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * RF-01.01 register (`identity` module, `specs/F01-perfil-onboarding/plan.md` §2, task F01-T05).
 *
 * <p>{@code RegisterUser.execute} still throws {@code UnsupportedOperationException} on purpose
 * (minimal skeleton, this agent's task): these tests compile and fail on their assertions, never on
 * compilation. {@code dev-backend-java} turns them green in F01-T05.
 */
class RegisterUserTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  @Test
  void createsANewAccountWhenTheEmailIsNotRegisteredYet() {
    FakeUserRepository userRepository = new FakeUserRepository();
    RegisterUser useCase = new RegisterUser(userRepository, new FakePasswordHasher(), FIXED_CLOCK);
    RegisterUserCommand command =
        new RegisterUserCommand("nueva@fitapp.test", "Sup3rSecret!", "1.0", true);

    assertThatCode(() -> useCase.execute(command)).doesNotThrowAnyException();

    assertThat(userRepository.findByEmail("nueva@fitapp.test")).isPresent();
  }

  @Test
  void rejectsRegistrationWithAnEmailThatIsAlreadyRegistered_409_EMAIL_ALREADY_REGISTERED() {
    FakeUserRepository userRepository = new FakeUserRepository();
    userRepository.seed(
        new User(
            UUID.randomUUID(),
            "ana@fitapp.test",
            "hash",
            "1.0",
            true,
            Instant.now(FIXED_CLOCK),
            null));
    RegisterUser useCase = new RegisterUser(userRepository, new FakePasswordHasher(), FIXED_CLOCK);
    RegisterUserCommand command =
        new RegisterUserCommand("ana@fitapp.test", "OtraClave1!", "1.0", true);

    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(EmailAlreadyRegisteredException.class);
  }

  @Test
  void rejectsRegistrationWithoutExplicitHealthDataConsent_CA0107_1() {
    FakeUserRepository userRepository = new FakeUserRepository();
    RegisterUser useCase = new RegisterUser(userRepository, new FakePasswordHasher(), FIXED_CLOCK);
    RegisterUserCommand command =
        new RegisterUserCommand("nueva@fitapp.test", "Sup3rSecret!", "1.0", false);

    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(HealthConsentRequiredException.class);
  }
}
