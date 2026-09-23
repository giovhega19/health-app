package com.fitapp.shared.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * Writes a `Problem` body (RFC 9457) for requests rejected by Spring Security itself (missing,
 * malformed or expired bearer token) — without this, the OAuth2 Resource Server default entry point
 * returns a bare `401` with no body, which does not match the `Problem` schema every other `401`
 * response in `openapi.yaml` uses.
 */
@Component
public class ProblemAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  public ProblemAuthenticationEntryPoint(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws IOException {
    Map<String, Object> problem = new LinkedHashMap<>();
    problem.put("type", "https://fitapp.dev/problems/auth-invalid-token");
    problem.put("title", "Unauthorized");
    problem.put("status", HttpStatus.UNAUTHORIZED.value());
    problem.put("detail", "The access token is invalid, expired or missing.");
    problem.put("code", "AUTH_INVALID_TOKEN");
    response.setStatus(HttpStatus.UNAUTHORIZED.value());
    response.setContentType("application/problem+json");
    objectMapper.writeValue(response.getWriter(), problem);
  }
}
