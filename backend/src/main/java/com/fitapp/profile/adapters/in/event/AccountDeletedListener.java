package com.fitapp.profile.adapters.in.event;

import com.fitapp.identity.domain.events.AccountDeleted;
import com.fitapp.profile.application.PurgeProfileData;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Reacts to {@code identity}'s {@link AccountDeleted} (published by {@code DeleteAccount}) by
 * purging this module's rows for the user (Art. 5.4/9.2 of 00-constitucion.md: modules talk only
 * through public API/events, never by reaching into another module's repositories).
 *
 * <p>Plain {@code @EventListener} on purpose, not {@code @TransactionalEventListener(phase =
 * AFTER_COMMIT)}/{@code @ApplicationModuleListener}: those run asynchronously, after the publishing
 * transaction commits, in a separate thread — here we want this listener to run synchronously,
 * inside the very same transaction `DeleteAccount` opened, so a failure here rolls back the whole
 * account deletion instead of silently leaving `profile_profiles`/`profile_body_metrics` orphaned
 * (see the reliability discussion in {@code DeleteAccount}'s Javadoc).
 */
@Component
public class AccountDeletedListener {

  private final PurgeProfileData purgeProfileData;

  public AccountDeletedListener(PurgeProfileData purgeProfileData) {
    this.purgeProfileData = purgeProfileData;
  }

  @EventListener
  public void on(AccountDeleted event) {
    purgeProfileData.execute(event.userId());
  }
}
