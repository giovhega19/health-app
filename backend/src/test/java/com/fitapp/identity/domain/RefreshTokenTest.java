package com.fitapp.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RefreshTokenTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  private static RefreshToken aToken(Instant expiresAt, Instant revokedAt) {
    return new RefreshToken(
        UUID.randomUUID(),
        UUID.randomUUID(),
        "hash",
        UUID.randomUUID(),
        Instant.now(FIXED_CLOCK),
        expiresAt,
        revokedAt);
  }

  @Test
  void isUsableWhenNeitherRevokedNorExpired() {
    RefreshToken token = aToken(Instant.now(FIXED_CLOCK).plusSeconds(3600), null);

    assertThat(token.isUsable(FIXED_CLOCK)).isTrue();
  }

  @Test
  void isNotUsableWhenRevoked() {
    RefreshToken token =
        aToken(Instant.now(FIXED_CLOCK).plusSeconds(3600), Instant.now(FIXED_CLOCK));

    assertThat(token.isUsable(FIXED_CLOCK)).isFalse();
  }

  @Test
  void isNotUsableWhenExpired() {
    RefreshToken token = aToken(Instant.now(FIXED_CLOCK).minusSeconds(1), null);

    assertThat(token.isUsable(FIXED_CLOCK)).isFalse();
  }
}
