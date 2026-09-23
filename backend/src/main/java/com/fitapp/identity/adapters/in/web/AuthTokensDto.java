package com.fitapp.identity.adapters.in.web;

/** Mirrors `AuthTokens` in openapi.yaml. */
public record AuthTokensDto(String accessToken, String refreshToken, UserSummaryDto user) {}
