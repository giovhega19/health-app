package com.fitapp.profile.application;

import java.util.UUID;

/** Output of {@link UpsertProfile}. */
public record UpsertProfileResult(UUID profileId) {}
