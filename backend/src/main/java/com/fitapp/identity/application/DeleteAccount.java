package com.fitapp.identity.application;

import com.fitapp.identity.domain.RefreshTokenRepository;
import com.fitapp.identity.domain.User;
import com.fitapp.identity.domain.UserRepository;
import com.fitapp.identity.domain.events.AccountDeleted;
import java.time.Clock;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-01.08 `DELETE /me` use case (`specs/F01-perfil-onboarding/plan.md` §2/§3, task F01-T05).
 *
 * <p>Soft-deletes the user ({@code deletedAt = clock.instant()}, Art. 5.4: immediate and definitive
 * logical deletion, purged within ≤ 30 days by a separate housekeeping job — no such job is
 * scheduled from application code, see final report) and revokes every refresh token for the
 * account (CA-01.08.1: a subsequent login with the same credentials must fail with {@link
 * com.fitapp.identity.domain.InvalidCredentialsException}, see {@code LoginUser}).
 *
 * <p>Also publishes {@link AccountDeleted} so every other module holding data about this {@code
 * userId} can delete it too (Art. 5.4: "eliminar cuenta y sus datos", not just the {@code
 * identity_users} row — see {@code profile}'s {@code AccountDeletedListener}). The event is
 * published with a plain (synchronous) {@link ApplicationEventPublisher#publishEvent(Object)} call
 * from inside this method's own {@code @Transactional} boundary — deliberately *not*
 * {@code @TransactionalEventListener(phase = AFTER_COMMIT)}/{@code @ApplicationModuleListener}
 * (which run asynchronously, in a separate thread, after commit): H1 is a single-process monolith,
 * so a synchronous, same-transaction call is simpler and strictly more reliable here — if a
 * listener (e.g. `profile`'s) throws, the whole deletion (including the `identity_users`
 * soft-delete and refresh-token revocation already performed above) rolls back atomically instead
 * of leaving orphaned health data or a half-deleted account. The trade-off is that a slow or
 * failing listener directly slows down / fails `DELETE /me`; acceptable for the number of listeners
 * and data volumes in H1. If a future module's listener has to do slow/unreliable work (e.g. an
 * external call), reconsider outbox/async at that point rather than defaulting to it now.
 */
@Component
public class DeleteAccount {

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final ApplicationEventPublisher eventPublisher;
  private final Clock clock;

  public DeleteAccount(
      UserRepository userRepository,
      RefreshTokenRepository refreshTokenRepository,
      ApplicationEventPublisher eventPublisher,
      Clock clock) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.eventPublisher = eventPublisher;
    this.clock = clock;
  }

  @Transactional
  public void execute(UUID userId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    User deleted =
        new User(
            user.id(),
            user.email(),
            user.passwordHash(),
            user.acceptedTermsVersion(),
            user.healthDataConsent(),
            user.createdAt(),
            clock.instant());
    userRepository.save(deleted);
    refreshTokenRepository.revokeAllForUser(userId);
    eventPublisher.publishEvent(new AccountDeleted(userId, clock.instant()));
  }
}
