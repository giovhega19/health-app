package com.fitapp.shared.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.identity.domain.InvalidCredentialsException;
import com.fitapp.profile.domain.AgeBelowMinimumException;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;

/** RFC 9457 mapping (`06-contratos-api.md` §1) shared by every module's domain exceptions. */
class ApiExceptionHandlerTest {

  private final ApiExceptionHandler handler = new ApiExceptionHandler();

  @Test
  void mapsAnApiExceptionToItsDeclaredStatusAndCode() {
    ProblemDetail problem = handler.handleApiException(new InvalidCredentialsException());

    assertThat(problem.getStatus()).isEqualTo(401);
    assertThat(problem.getProperties()).containsEntry("code", "AUTH_INVALID_CREDENTIALS");
  }

  @Test
  void attachesFieldErrorsWhenTheExceptionDeclaresThem() {
    ProblemDetail problem = handler.handleApiException(new AgeBelowMinimumException(10));

    assertThat(problem.getStatus()).isEqualTo(422);
    assertThat(problem.getProperties()).containsKey("errors");
  }

  @Test
  void mapsANotFoundExceptionTo404() {
    ProblemDetail problem = handler.handleNotFound(new NoSuchElementException("missing"));

    assertThat(problem.getStatus()).isEqualTo(404);
    assertThat(problem.getProperties()).containsEntry("code", "NOT_FOUND");
  }
}
