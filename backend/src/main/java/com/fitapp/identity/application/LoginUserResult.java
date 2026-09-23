package com.fitapp.identity.application;

import java.util.UUID;

/** Output of {@link LoginUser}. */
public record LoginUserResult(UUID userId, String email) {}
