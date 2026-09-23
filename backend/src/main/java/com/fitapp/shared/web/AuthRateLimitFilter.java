package com.fitapp.shared.web;

import com.fitapp.shared.config.AuthRateLimitProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Minimal rate limit for `/auth/*` (06-contratos-api.md §1: "10 req/min por IP"): a fixed-window
 * counter per client IP, kept in memory (single-instance backend, no shared cache yet — a
 * distributed limiter is out of scope for H1). Exceeding the window responds `429` with a `Problem`
 * body and `Retry-After`, matching the rest of the error format used across the API.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

  private final AuthRateLimitProperties properties;
  private final Clock clock;
  private final Map<String, Window> windowsByIp = new ConcurrentHashMap<>();

  public AuthRateLimitFilter(AuthRateLimitProperties properties, Clock clock) {
    this.properties = properties;
    this.clock = clock;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return !request.getRequestURI().startsWith("/api/v1/auth/");
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String clientIp = request.getRemoteAddr();
    Window window =
        windowsByIp.compute(
            clientIp,
            (ip, existing) -> {
              Instant now = clock.instant();
              if (existing == null || existing.expired(now)) {
                return new Window(now.plus(properties.window()), 1);
              }
              return existing.increment();
            });
    if (window.count() > properties.maxRequests()) {
      long retryAfterSeconds =
          Math.max(1, java.time.Duration.between(clock.instant(), window.resetAt()).toSeconds());
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
      response.setContentType("application/problem+json");
      response
          .getWriter()
          .write(
              """
              {"type":"https://fitapp.dev/problems/rate-limit-exceeded","title":"Too Many Requests",\
              "status":429,"code":"RATE_LIMIT_EXCEEDED",\
              "detail":"Too many requests. Try again later."}""");
      return;
    }
    filterChain.doFilter(request, response);
  }

  private record Window(Instant resetAt, int count) {
    boolean expired(Instant now) {
      return !now.isBefore(resetAt);
    }

    Window increment() {
      return new Window(resetAt, count + 1);
    }
  }
}
