package com.fitapp.identity.application;

import com.fitapp.identity.domain.EmailAlreadyRegisteredException;
import com.fitapp.identity.domain.HealthConsentRequiredException;
import com.fitapp.identity.domain.PasswordHasher;
import com.fitapp.identity.domain.User;
import com.fitapp.identity.domain.UserRepository;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-01.01 register use case (`specs/F01-perfil-onboarding/plan.md` §2, task F01-T05).
 *
 * <p>Rejects a duplicate email with {@link EmailAlreadyRegisteredException} (409
 * EMAIL_ALREADY_REGISTERED), rejects a missing health data consent with {@link
 * HealthConsentRequiredException} (CA-01.07.1), hashes the password with {@link PasswordHasher} and
 * persists the new {@link User} with {@code clock.instant()} as {@code createdAt} (Art. 2.4: the
 * clock is a port). Token issuance (access/refresh) is deliberately out of this use case: it is
 * orchestrated by {@link IssueTokensForUser} from the web adapter, so this class keeps the exact
 * constructor already fixed by {@code RegisterUserTest} (no {@code TokenIssuer}/{@code
 * RefreshTokenRepository} dependency here).
 */
@Component
public class RegisterUser {

  private final UserRepository userRepository;
  private final PasswordHasher passwordHasher;
  private final Clock clock;

  public RegisterUser(UserRepository userRepository, PasswordHasher passwordHasher, Clock clock) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.clock = clock;
  }

  @Transactional
  public RegisterUserResult execute(RegisterUserCommand command) {
    if (!command.healthDataConsent()) {
      throw new HealthConsentRequiredException();
    }
    if (userRepository.findByEmail(command.email()).isPresent()) {
      throw new EmailAlreadyRegisteredException(command.email());
    }
    User user =
        new User(
            UUID.randomUUID(),
            command.email(),
            passwordHasher.hash(command.password()),
            command.acceptedTermsVersion(),
            true,
            clock.instant(),
            null);
    User saved = userRepository.save(user);
    return new RegisterUserResult(saved.id(), saved.email());
  }
}
