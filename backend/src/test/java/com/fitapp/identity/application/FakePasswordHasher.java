package com.fitapp.identity.application;

import com.fitapp.identity.domain.PasswordHasher;

/**
 * Deterministic in-memory fake of {@link PasswordHasher} (no real Argon2id): only for tests, never
 * used in production (`07-estrategia-pruebas.md` §2.4 "fakes before mocks").
 */
public class FakePasswordHasher implements PasswordHasher {

  @Override
  public String hash(String rawPassword) {
    return "fake-hash-of-" + rawPassword;
  }

  @Override
  public boolean matches(String rawPassword, String passwordHash) {
    return hash(rawPassword).equals(passwordHash);
  }
}
