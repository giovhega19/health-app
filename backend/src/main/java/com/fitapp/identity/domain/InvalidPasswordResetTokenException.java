package com.fitapp.identity.domain;

import com.fitapp.shared.domain.ApiException;

/**
 * `POST /auth/password/reset` with a token that is unknown, already used or expired -> 401, `code:
 * "AUTH_PASSWORD_RESET_TOKEN_INVALID"` (`packages/api-contract/openapi.yaml`).
 */
public class InvalidPasswordResetTokenException extends ApiException {

  public static final String CODE = "AUTH_PASSWORD_RESET_TOKEN_INVALID";

  public InvalidPasswordResetTokenException() {
    super(
        401,
        CODE,
        "auth-password-reset-token-invalid",
        "The password reset token is not valid, was already used or expired.");
  }
}
