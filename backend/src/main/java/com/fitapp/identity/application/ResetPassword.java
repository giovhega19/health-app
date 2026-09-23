package com.fitapp.identity.application;

import com.fitapp.identity.domain.InvalidPasswordResetTokenException;
import com.fitapp.identity.domain.OpaqueTokens;
import com.fitapp.identity.domain.PasswordHasher;
import com.fitapp.identity.domain.PasswordResetToken;
import com.fitapp.identity.domain.PasswordResetTokenRepository;
import com.fitapp.identity.domain.User;
import com.fitapp.identity.domain.UserRepository;
import java.time.Clock;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-01.01 `POST /auth/password/reset`: redeems a single-use token (30 min TTL) and sets a new
 * password hash. Rejects an unknown, already-used or expired token with {@link
 * InvalidPasswordResetTokenException} (401 AUTH_PASSWORD_RESET_TOKEN_INVALID).
 */
@Component
public class ResetPassword {

  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final UserRepository userRepository;
  private final PasswordHasher passwordHasher;
  private final Clock clock;

  public ResetPassword(
      PasswordResetTokenRepository passwordResetTokenRepository,
      UserRepository userRepository,
      PasswordHasher passwordHasher,
      Clock clock) {
    this.passwordResetTokenRepository = passwordResetTokenRepository;
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.clock = clock;
  }

  @Transactional
  public void execute(String rawToken, String newPassword) {
    PasswordResetToken token =
        passwordResetTokenRepository
            .findByTokenHash(OpaqueTokens.hash(rawToken))
            .filter(candidate -> candidate.isUsable(clock))
            .orElseThrow(InvalidPasswordResetTokenException::new);
    User user =
        userRepository
            .findById(token.userId())
            .orElseThrow(InvalidPasswordResetTokenException::new);
    User updated =
        new User(
            user.id(),
            user.email(),
            passwordHasher.hash(newPassword),
            user.acceptedTermsVersion(),
            user.healthDataConsent(),
            user.createdAt(),
            user.deletedAt());
    userRepository.save(updated);
    passwordResetTokenRepository.save(token.markUsed(clock.instant()));
  }
}
