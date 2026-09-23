package com.fitapp.identity.application;

import com.fitapp.identity.domain.OpaqueTokens;
import com.fitapp.identity.domain.PasswordResetToken;
import com.fitapp.identity.domain.PasswordResetTokenRepository;
import com.fitapp.identity.domain.UserRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-01.01 `POST /auth/password/forgot`: always succeeds from the caller's point of view (the
 * controller always returns `202`, whether or not the email is registered — `openapi.yaml`: "para
 * no revelar si un email está registrado"). Silently does nothing when the email is unknown.
 *
 * <p><b>Deviation from the full flow (documented, see final report):</b> this use case creates and
 * persists the single-use token; actually emailing it to the user is out of scope for this round
 * (no email/SMTP provider is configured anywhere in the project yet — no `NotificationPort`
 * exists). {@code ResetPassword} still fully validates a token end-to-end once one exists (e.g.
 * seeded directly in the integration test), so the redemption half of the flow is real.
 */
@Component
public class RequestPasswordReset {

  private static final Duration TOKEN_TTL = Duration.ofMinutes(30);

  private final UserRepository userRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final Clock clock;

  public RequestPasswordReset(
      UserRepository userRepository,
      PasswordResetTokenRepository passwordResetTokenRepository,
      Clock clock) {
    this.userRepository = userRepository;
    this.passwordResetTokenRepository = passwordResetTokenRepository;
    this.clock = clock;
  }

  @Transactional
  public void execute(String email) {
    userRepository
        .findByEmail(email)
        .ifPresent(
            user -> {
              Instant now = clock.instant();
              String rawToken = OpaqueTokens.generate();
              passwordResetTokenRepository.save(
                  new PasswordResetToken(
                      UUID.randomUUID(),
                      user.id(),
                      OpaqueTokens.hash(rawToken),
                      now,
                      now.plus(TOKEN_TTL),
                      null));
            });
  }
}
