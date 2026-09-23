package com.fitapp.identity.application;

import com.fitapp.identity.domain.User;
import com.fitapp.identity.domain.UserRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * In-memory fake of {@link UserRepository} ("fakes before mocks for repository ports",
 * `07-estrategia-pruebas.md` §2.4). {@link #findByEmail} ignores soft-deleted users, so {@code
 * LoginUserTest}/{@code DeleteAccountTest} can assert CA-01.08.1 (a deleted account can no longer
 * log in) without a real database.
 */
public class FakeUserRepository implements UserRepository {

  private final Map<UUID, User> byId = new HashMap<>();

  public void seed(User user) {
    byId.put(user.id(), user);
  }

  @Override
  public Optional<User> findByEmail(String email) {
    return byId.values().stream()
        .filter(user -> user.email().equalsIgnoreCase(email) && !user.isDeleted())
        .findFirst();
  }

  @Override
  public Optional<User> findById(UUID id) {
    return Optional.ofNullable(byId.get(id));
  }

  @Override
  public User save(User user) {
    byId.put(user.id(), user);
    return user;
  }
}
