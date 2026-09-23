package com.fitapp.identity.domain;

import com.fitapp.shared.domain.ApiException;

/**
 * `POST /auth/login` with a wrong email/password -> 401, `code: "AUTH_INVALID_CREDENTIALS"`
 * (`packages/api-contract/openapi.yaml`). Also the expected outcome of CA-01.08.1 when logging in
 * with the credentials of a deleted account.
 */
public class InvalidCredentialsException extends ApiException {

  public static final String CODE = "AUTH_INVALID_CREDENTIALS";

  public InvalidCredentialsException() {
    super(401, CODE, "auth-invalid-credentials", "The email or password is not correct.");
  }
}
