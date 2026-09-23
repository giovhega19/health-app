package com.fitapp.shared.web;

import com.fitapp.shared.domain.ApiException;
import java.net.URI;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Single place that turns exceptions into RFC 9457 {@code application/problem+json} responses
 * (`06-contratos-api.md` §1). Handles the shared {@link ApiException} contract used by every
 * module's domain exceptions (see its Javadoc for why `shared` never imports a concrete exception
 * type from `identity`/`profile`/etc., keeping the Spring Modulith module graph acyclic) plus Bean
 * Validation failures on `@RequestBody` DTOs.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

  private static final String PROBLEM_BASE_URI = "https://fitapp.dev/problems/";

  @ExceptionHandler(ApiException.class)
  public ProblemDetail handleApiException(ApiException exception) {
    ProblemDetail problem =
        problemOf(exception.httpStatus(), exception.problemSlug(), exception.getMessage());
    problem.setProperty("code", exception.code());
    if (!exception.fieldErrors().isEmpty()) {
      problem.setProperty(
          "errors",
          exception.fieldErrors().stream()
              .map(
                  fieldError ->
                      Map.of(
                          "field", fieldError.field(),
                          "code", fieldError.code(),
                          "detail", String.valueOf(fieldError.detail())))
              .toList());
    }
    return problem;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ProblemDetail handleValidation(MethodArgumentNotValidException exception) {
    ProblemDetail problem = problemOf(422, "validation-error", "One or more fields are invalid.");
    problem.setProperty("code", "VALIDATION_ERROR");
    problem.setProperty(
        "errors",
        exception.getBindingResult().getFieldErrors().stream()
            .map(
                fieldError ->
                    Map.of(
                        "field", fieldError.getField(),
                        "code", "FIELD_INVALID",
                        "detail", String.valueOf(fieldError.getDefaultMessage())))
            .toList());
    return problem;
  }

  @ExceptionHandler(NoSuchElementException.class)
  public ProblemDetail handleNotFound(NoSuchElementException exception) {
    ProblemDetail problem = problemOf(404, "not-found", exception.getMessage());
    problem.setProperty("code", "NOT_FOUND");
    return problem;
  }

  private static ProblemDetail problemOf(int status, String slug, String detail) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.valueOf(status), detail);
    problem.setType(URI.create(PROBLEM_BASE_URI + slug));
    problem.setTitle(slug.replace('-', ' '));
    return problem;
  }
}
