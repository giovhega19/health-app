package com.fitapp.identity.domain;

import java.util.Optional;
import java.util.UUID;

/**
 * Out port for {@link User} persistence (Art. 2.3 of 00-constitucion.md: all I/O goes through a
 * port declared in domain/application). Implemented by {@code identity/adapters/out/persistence} in
 * F01-T05.
 */
public interface UserRepository {

  Optional<User> findByEmail(String email);

  Optional<User> findById(UUID id);

  User save(User user);
}
