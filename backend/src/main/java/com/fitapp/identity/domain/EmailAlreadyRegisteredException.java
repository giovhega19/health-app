package com.fitapp.identity.domain;

import com.fitapp.shared.domain.ApiException;

/**
 * `POST /auth/register` / `/auth/guest/upgrade` with an email that is already registered -> 409,
 * `code: "EMAIL_ALREADY_REGISTERED"` (`packages/api-contract/openapi.yaml`).
 */
public class EmailAlreadyRegisteredException extends ApiException {

  public static final String CODE = "EMAIL_ALREADY_REGISTERED";

  public EmailAlreadyRegisteredException(String email) {
    super(409, CODE, "email-already-registered", "Email already registered: " + email);
  }
}
