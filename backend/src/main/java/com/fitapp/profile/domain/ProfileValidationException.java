package com.fitapp.profile.domain;

import com.fitapp.shared.domain.ApiException;
import java.util.List;

/**
 * Generic field-range validation failure for the profile/body-metric replica (RN-02: height 100–250
 * cm, weight 25–350 kg — `specs/F01-perfil-onboarding/spec.md` "Validaciones"). Distinct from
 * {@link AgeBelowMinimumException} because it covers several interchangeable fields instead of one
 * specific rule.
 */
public class ProfileValidationException extends ApiException {

  public static final String CODE = "VALIDATION_ERROR";

  private final String field;

  public ProfileValidationException(String field, String detail) {
    super(422, CODE, "validation-error", detail);
    this.field = field;
  }

  @Override
  public List<FieldError> fieldErrors() {
    return List.of(new FieldError(field, "FIELD_OUT_OF_RANGE", getMessage()));
  }
}
