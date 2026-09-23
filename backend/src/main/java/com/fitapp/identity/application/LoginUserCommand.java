package com.fitapp.identity.application;

/** Input of {@link LoginUser}, mirrors `LoginRequest` in `packages/api-contract/openapi.yaml`. */
public record LoginUserCommand(String email, String password) {}
