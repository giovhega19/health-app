package com.fitapp.identity.application;

import com.fitapp.identity.domain.InvalidCredentialsException;
import com.fitapp.identity.domain.PasswordHasher;
import com.fitapp.identity.domain.User;
import com.fitapp.identity.domain.UserRepository;
import org.springframework.stereotype.Component;

/**
 * RF-01.01 login use case (`specs/F01-perfil-onboarding/plan.md` §2, task F01-T05).
 *
 * <p>Rejects an unknown email or a wrong password with {@link InvalidCredentialsException} (401
 * AUTH_INVALID_CREDENTIALS) — the same code for both cases, so the error never reveals whether an
 * email exists; a deleted user (Art. 5.4, CA-01.08.1) is also rejected as invalid credentials
 * because {@link UserRepository#findByEmail} never returns soft-deleted users.
 */
@Component
public class LoginUser {

  private final UserRepository userRepository;
  private final PasswordHasher passwordHasher;

  public LoginUser(UserRepository userRepository, PasswordHasher passwordHasher) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  public LoginUserResult execute(LoginUserCommand command) {
    User user =
        userRepository
            .findByEmail(command.email())
            .filter(
                candidate -> passwordHasher.matches(command.password(), candidate.passwordHash()))
            .orElseThrow(InvalidCredentialsException::new);
    return new LoginUserResult(user.id(), user.email());
  }
}
