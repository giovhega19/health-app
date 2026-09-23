package com.fitapp.profile.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AgeBelowMinimumExceptionTest {

  @Test
  void exposesTheOffendingAgeAndAFieldErrorOnBirthDate() {
    AgeBelowMinimumException exception = new AgeBelowMinimumException(10);

    assertThat(exception.age()).isEqualTo(10);
    assertThat(exception.fieldErrors()).hasSize(1);
    assertThat(exception.fieldErrors().get(0).field()).isEqualTo("birthDate");
  }
}
