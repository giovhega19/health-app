package com.fitapp.identity.domain;

import com.fitapp.shared.domain.ApiException;

/**
 * `POST /auth/refresh` / `/auth/logout` with a refresh token that is unknown, already used
 * (rotated), revoked or expired -> 401, `code: "AUTH_REFRESH_TOKEN_INVALID"`
 * (`packages/api-contract/openapi.yaml`).
 */
public class InvalidRefreshTokenException extends ApiException {

  public static final String CODE = "AUTH_REFRESH_TOKEN_INVALID";

  public InvalidRefreshTokenException() {
    super(
        401,
        CODE,
        "auth-refresh-token-invalid",
        "The refresh token is not valid, was already used or expired.");
  }
}
