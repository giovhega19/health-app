package com.fitapp.identity.application;

import java.util.UUID;

/** Output shared by every use case that (re)issues tokens, mirrors `AuthTokens` in openapi.yaml. */
public record AuthTokensResult(
    String accessToken, String refreshToken, UUID userId, String email) {}
