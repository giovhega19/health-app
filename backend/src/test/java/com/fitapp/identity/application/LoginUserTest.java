package com.fitapp.identity.application;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fitapp.identity.domain.InvalidCredentialsException;
import com.fitapp.identity.domain.User;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * RF-01.01 login. Login itself has no dedicated `CA-01.xx.y` in `spec.md` (only its consequence
 * after deleting the account, CA-01.08.1, see {@code DeleteAccountTest}); it is tested here
 * regardless because this agent's task explicitly asks for it ("login con credenciales inválidas ->
 * 401"). {@code LoginUser.execute} still throws {@code UnsupportedOperationException} on purpose:
 * these tests fail on their assertions, not on compilation.
 */
class LoginUserTest {

  @Test
  void logsInWithTheCorrectPassword() {
    FakePasswordHasher passwordHasher = new FakePasswordHasher();
    FakeUserRepository userRepository = new FakeUserRepository();
    userRepository.seed(
        new User(
            UUID.randomUUID(),
            "ana@fitapp.test",
            passwordHasher.hash("Sup3rSecret!"),
            "1.0",
            true,
            Instant.parse("2026-09-22T10:00:00Z"),
            null));
    LoginUser useCase = new LoginUser(userRepository, passwordHasher);

    assertThatCode(() -> useCase.execute(new LoginUserCommand("ana@fitapp.test", "Sup3rSecret!")))
        .doesNotThrowAnyException();
  }

  @Test
  void rejectsLoginWithAWrongPassword_401_AUTH_INVALID_CREDENTIALS() {
    FakePasswordHasher passwordHasher = new FakePasswordHasher();
    FakeUserRepository userRepository = new FakeUserRepository();
    userRepository.seed(
        new User(
            UUID.randomUUID(),
            "ana@fitapp.test",
            passwordHasher.hash("Sup3rSecret!"),
            "1.0",
            true,
            Instant.parse("2026-09-22T10:00:00Z"),
            null));
    LoginUser useCase = new LoginUser(userRepository, passwordHasher);

    assertThatThrownBy(
            () -> useCase.execute(new LoginUserCommand("ana@fitapp.test", "wrong-password")))
        .isInstanceOf(InvalidCredentialsException.class);
  }

  @Test
  void rejectsLoginForAnEmailThatDoesNotExist_401_AUTH_INVALID_CREDENTIALS() {
    FakeUserRepository userRepository = new FakeUserRepository();
    LoginUser useCase = new LoginUser(userRepository, new FakePasswordHasher());

    assertThatThrownBy(
            () -> useCase.execute(new LoginUserCommand("no-existe@fitapp.test", "whatever1")))
        .isInstanceOf(InvalidCredentialsException.class);
  }
}
