package com.fitapp.identity.domain;

import com.fitapp.shared.domain.ApiException;

/**
 * CA-01.07.1 (`specs/F01-perfil-onboarding/spec.md`) / Art. 5.3 of 00-constitucion.md: health data
 * consent must be explicit. `RegisterRequest.healthDataConsent` must be {@code true}.
 */
public class HealthConsentRequiredException extends ApiException {

  public static final String CODE = "HEALTH_CONSENT_REQUIRED";

  public HealthConsentRequiredException() {
    super(
        422,
        CODE,
        "health-consent-required",
        "Health data consent is required to register (Art. 5.3, CA-01.07.1).");
  }
}
