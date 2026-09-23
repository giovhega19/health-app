package com.fitapp.identity.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fitapp.identity.domain.User;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit test of the domain&lt;-&gt;entity mapping in {@link UserRepositoryJpaAdapter}, with the
 * Spring Data repository mocked (no database) — complements {@code
 * UserRepositoryJpaAdapterIntegrationTest} (Testcontainers, real PostgreSQL).
 */
@ExtendWith(MockitoExtension.class)
class UserRepositoryJpaAdapterTest {

  @Mock private UserJpaRepository jpaRepository;

  @Test
  void savesAndMapsBackToADomainUser() {
    UserRepositoryJpaAdapter adapter = new UserRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    User user =
        new User(
            id,
            "ana@fitapp.test",
            "hash",
            "1.0",
            true,
            Instant.parse("2026-01-01T00:00:00Z"),
            null);
    UserEntity entity =
        new UserEntity(
            id,
            "ana@fitapp.test",
            "hash",
            "1.0",
            true,
            Instant.parse("2026-01-01T00:00:00Z"),
            null);
    when(jpaRepository.save(any(UserEntity.class))).thenReturn(entity);

    User saved = adapter.save(user);

    assertThat(saved).isEqualTo(user);
  }

  @Test
  void findByEmailDelegatesToTheCaseInsensitiveActiveOnlyQuery() {
    UserRepositoryJpaAdapter adapter = new UserRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    UserEntity entity =
        new UserEntity(
            id,
            "ana@fitapp.test",
            "hash",
            "1.0",
            true,
            Instant.parse("2026-01-01T00:00:00Z"),
            null);
    when(jpaRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("ana@fitapp.test"))
        .thenReturn(Optional.of(entity));

    Optional<User> found = adapter.findByEmail("ana@fitapp.test");

    assertThat(found).get().extracting(User::id).isEqualTo(id);
    verify(jpaRepository).findByEmailIgnoreCaseAndDeletedAtIsNull("ana@fitapp.test");
  }

  @Test
  void findByIdReturnsEmptyWhenNotFound() {
    UserRepositoryJpaAdapter adapter = new UserRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    when(jpaRepository.findById(id)).thenReturn(Optional.empty());

    assertThat(adapter.findById(id)).isEmpty();
  }

  @Test
  void mapsASoftDeletedEntityBackWithItsDeletedAt() {
    UserRepositoryJpaAdapter adapter = new UserRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    Instant deletedAt = Instant.parse("2026-02-01T00:00:00Z");
    UserEntity entity =
        new UserEntity(
            id,
            "ana@fitapp.test",
            "hash",
            "1.0",
            true,
            Instant.parse("2026-01-01T00:00:00Z"),
            deletedAt);
    when(jpaRepository.findById(id)).thenReturn(Optional.of(entity));

    assertThat(adapter.findById(id)).get().extracting(User::isDeleted).isEqualTo(true);
  }
}
