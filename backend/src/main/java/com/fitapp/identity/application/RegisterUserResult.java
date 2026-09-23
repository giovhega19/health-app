package com.fitapp.identity.application;

import java.util.UUID;

/** Output of {@link RegisterUser}, mirrors the `user` field of `AuthTokens`. */
public record RegisterUserResult(UUID userId, String email) {}
