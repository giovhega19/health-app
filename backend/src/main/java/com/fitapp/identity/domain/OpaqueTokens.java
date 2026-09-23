package com.fitapp.identity.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Pure helpers for opaque bearer tokens (refresh tokens, password reset tokens): a
 * cryptographically random raw value handed to the client, stored server-side only as its SHA-256
 * hash (so a database leak never exposes valid tokens — the same rationale as password hashing, but
 * a fast hash is enough here because the input already has 256 bits of entropy, unlike a
 * human-chosen password). Plain JDK (`java.security.*`), no framework dependency, so it can live in
 * `domain` (Art. 2.2 of 00-constitucion.md).
 */
public final class OpaqueTokens {

  private static final SecureRandom RANDOM = new SecureRandom();

  private OpaqueTokens() {}

  public static String generate() {
    byte[] bytes = new byte[32];
    RANDOM.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  public static String hash(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hashBytes);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 is not available", e);
    }
  }
}
