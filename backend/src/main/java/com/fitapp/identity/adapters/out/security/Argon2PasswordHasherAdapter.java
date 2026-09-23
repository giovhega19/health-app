package com.fitapp.identity.adapters.out.security;

import com.fitapp.identity.domain.PasswordHasher;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Real {@link PasswordHasher} adapter, Argon2id via Spring Security Crypto
 * (`specs/F01-perfil-onboarding/plan.md` §2/§3, 04-arquitectura.md §2). Parameters follow {@link
 * Argon2PasswordEncoder#defaultsForSpringSecurity_v5_8()} (16-byte salt, 32-byte hash, 1 iteration
 * — Spring Security's Argon2id defaults). Never used in tests (`FakePasswordHasher` is used there,
 * `07-estrategia-pruebas.md` §2.4: fakes before mocks, and a real Argon2id run is intentionally
 * slow).
 */
@Component
public class Argon2PasswordHasherAdapter implements PasswordHasher {

  private final Argon2PasswordEncoder encoder =
      Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

  @Override
  public String hash(String rawPassword) {
    return encoder.encode(rawPassword);
  }

  @Override
  public boolean matches(String rawPassword, String passwordHash) {
    return encoder.matches(rawPassword, passwordHash);
  }
}
