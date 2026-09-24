package com.fitapp.training.adapters.in.event;

import com.fitapp.identity.domain.events.AccountDeleted;
import com.fitapp.training.application.PurgeTrainingData;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Reacts to {@code identity}'s {@link AccountDeleted} (published by {@code DeleteAccount}) by
 * purging this module's rows for the user (Art. 5.4/9.2 of 00-constitucion.md: modules talk only
 * through public API/events, never by reaching into another module's repositories).
 *
 * <p>Plain {@code @EventListener} on purpose, not {@code @TransactionalEventListener(phase =
 * AFTER_COMMIT)}/{@code @ApplicationModuleListener} — same reasoning as {@code
 * profile.adapters.in.event.AccountDeletedListener} (F01, see its Javadoc): running synchronously,
 * inside `DeleteAccount`'s own transaction, means a failure here rolls back the whole account
 * deletion instead of silently leaving `training_user_routines`/`training_custom_exercises`/
 * `training_schedule_slots` orphaned.
 */
@Component
public class AccountDeletedListener {

  private final PurgeTrainingData purgeTrainingData;

  public AccountDeletedListener(PurgeTrainingData purgeTrainingData) {
    this.purgeTrainingData = purgeTrainingData;
  }

  @EventListener
  public void on(AccountDeleted event) {
    purgeTrainingData.execute(event.userId());
  }
}
