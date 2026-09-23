package com.fitapp.identity.application;

/**
 * Input of {@link RegisterUser}, mirrors `RegisterRequest` in `packages/api-contract/openapi.yaml`.
 */
public record RegisterUserCommand(
    String email, String password, String acceptedTermsVersion, boolean healthDataConsent) {}
