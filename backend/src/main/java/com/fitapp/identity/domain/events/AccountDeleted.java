package com.fitapp.identity.domain.events;

import java.time.Instant;
import java.util.UUID;

/**
 * Published by {@link com.fitapp.identity.application.DeleteAccount} right after the account is
 * soft-deleted and every refresh token revoked, so other modules holding data about {@code userId}
 * can delete/anonymize their own rows (Art. 5.4 of 00-constitucion.md: "eliminar cuenta y sus
 * datos"; RNF-08, Ley 1581 right of erasure).
 *
 * <p>{@code profile} is the only listener today ({@code
 * com.fitapp.profile.adapters.in.event.AccountDeletedListener}, deletes {@code profile_profiles} /
 * {@code profile_body_metrics}), but any future module holding per-user data should subscribe the
 * same way instead of `identity` learning about it (Art. 9.1/9.2: modules communicate by API or
 * events, never by one module reaching into another's persistence).
 */
public record AccountDeleted(UUID userId, Instant occurredAt) {}
