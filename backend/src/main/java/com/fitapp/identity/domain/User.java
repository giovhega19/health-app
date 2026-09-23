package com.fitapp.identity.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Aggregate root of the {@code identity} module (`specs/F01-perfil-onboarding/plan.md` §2). Plain
 * Java record (Art. 2.2 of 00-constitucion.md: no Spring/JPA in the domain layer).
 *
 * <p>Placeholder for the TDD red phase (F01-T01, qa-pruebas): fields only, no invariants yet (e.g.
 * email format, password strength) — {@code dev-backend-java} adds the real behaviour in F01-T05.
 */
public record User(
    UUID id,
    String email,
    String passwordHash,
    String acceptedTermsVersion,
    boolean healthDataConsent,
    Instant createdAt,
    Instant deletedAt) {

  public boolean isDeleted() {
    return deletedAt != null;
  }
}
