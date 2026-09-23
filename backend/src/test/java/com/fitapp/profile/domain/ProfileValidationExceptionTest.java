package com.fitapp.profile.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ProfileValidationExceptionTest {

  @Test
  void exposesAFieldErrorNamingTheOffendingField() {
    ProfileValidationException exception =
        new ProfileValidationException("heightCm", "out of range");

    assertThat(exception.fieldErrors()).hasSize(1);
    assertThat(exception.fieldErrors().get(0).field()).isEqualTo("heightCm");
    assertThat(exception.code()).isEqualTo(ProfileValidationException.CODE);
  }
}
