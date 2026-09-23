package com.fitapp.identity.domain;

/**
 * Out port for password hashing (Argon2id in production, `specs/F01-perfil-onboarding/plan.md`
 * §2/§3). The real Argon2id adapter is implemented in F01-T05; tests use an in-memory fake
 * (`FakePasswordHasher`), never a real hash algorithm (fast, deterministic unit tests).
 */
public interface PasswordHasher {

  String hash(String rawPassword);

  boolean matches(String rawPassword, String passwordHash);
}
