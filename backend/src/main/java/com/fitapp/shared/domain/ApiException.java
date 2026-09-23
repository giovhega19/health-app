package com.fitapp.shared.domain;

import java.util.List;

/**
 * Common base for domain exceptions that map 1:1 to an RFC 9457 `application/problem+json` response
 * (`06-contratos-api.md` §1). Framework-free on purpose (no {@code
 * org.springframework.http.HttpStatus}, only a plain {@code int}) so domain classes across every
 * module (`identity.domain`, `profile.domain`, ...) can extend it without violating Art. 2.2/2.3 of
 * 00-constitucion.md. {@code com.fitapp.shared.web.ApiExceptionHandler} is the single place that
 * turns any {@link ApiException} into an actual {@code ProblemDetail} HTTP response, so each module
 * never needs its own `@RestControllerAdvice` (and `shared` never has to import a concrete
 * exception type from `identity`/`profile`, which would create a module dependency cycle).
 */
public abstract class ApiException extends RuntimeException {

  private final int httpStatus;
  private final String code;
  private final String problemSlug;

  protected ApiException(int httpStatus, String code, String problemSlug, String message) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
    this.problemSlug = problemSlug;
  }

  /** HTTP status code of the mapped response, e.g. {@code 409}. */
  public int httpStatus() {
    return httpStatus;
  }

  /** Stable, machine-readable error code (`Problem.code` in `openapi.yaml`). */
  public String code() {
    return code;
  }

  /** Path segment of the `Problem.type` URI, e.g. {@code "email-already-registered"}. */
  public String problemSlug() {
    return problemSlug;
  }

  /**
   * Optional per-field validation errors (`Problem.errors[]` in `openapi.yaml`), empty by default.
   * Subclasses like {@code AgeBelowMinimumException} override this instead of {@code
   * shared.web.ApiExceptionHandler} special-casing a concrete subclass, which would otherwise
   * create a module dependency cycle (`shared` importing `profile`/`identity`).
   */
  public List<FieldError> fieldErrors() {
    return List.of();
  }

  /** One entry of `Problem.errors[]`. */
  public record FieldError(String field, String code, String detail) {}
}
