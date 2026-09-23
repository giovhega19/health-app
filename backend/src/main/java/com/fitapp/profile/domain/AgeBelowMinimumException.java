package com.fitapp.profile.domain;

import com.fitapp.shared.domain.ApiException;
import java.util.List;

/**
 * RN-01 (`05-modelo-dominio-reglas.md` §2, minimum age 16, decision D2). `PUT /me/profile` with an
 * age below the minimum -> 422, `code: "AGE_BELOW_MINIMUM"` on the `birthDate` field
 * (`packages/api-contract/openapi.yaml`). Mirrors the client-side validation of
 * `features/profile/domain/errors.ts#AgeBelowMinimumError` (defense in depth, both sides validate
 * RN-01 per the OpenAPI description of `updateMyProfile`).
 */
public class AgeBelowMinimumException extends ApiException {

  public static final String CODE = "AGE_BELOW_MINIMUM";
  public static final int MINIMUM_AGE = 16;

  private final int age;

  public AgeBelowMinimumException(int age) {
    super(
        422,
        CODE,
        "validation-error",
        "Age " + age + " is below the minimum of " + MINIMUM_AGE + " (RN-01, D2).");
    this.age = age;
  }

  public int age() {
    return age;
  }

  @Override
  public List<FieldError> fieldErrors() {
    return List.of(new FieldError("birthDate", CODE, getMessage()));
  }
}
