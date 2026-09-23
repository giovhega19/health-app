package com.fitapp.identity.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fitapp.identity.domain.PasswordResetToken;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PasswordResetTokenRepositoryJpaAdapterTest {

  @Mock private PasswordResetTokenJpaRepository jpaRepository;

  @Test
  void savesAndMapsBackToADomainToken() {
    PasswordResetTokenRepositoryJpaAdapter adapter =
        new PasswordResetTokenRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    PasswordResetToken token =
        new PasswordResetToken(
            id,
            UUID.randomUUID(),
            "hash",
            Instant.parse("2026-01-01T00:00:00Z"),
            Instant.parse("2026-01-01T00:30:00Z"),
            null);
    PasswordResetTokenEntity entity =
        new PasswordResetTokenEntity(
            id, token.userId(), "hash", token.createdAt(), token.expiresAt(), null);
    when(jpaRepository.save(any(PasswordResetTokenEntity.class))).thenReturn(entity);

    PasswordResetToken saved = adapter.save(token);

    assertThat(saved).isEqualTo(token);
  }

  @Test
  void findByTokenHashReturnsEmptyWhenNotFound() {
    PasswordResetTokenRepositoryJpaAdapter adapter =
        new PasswordResetTokenRepositoryJpaAdapter(jpaRepository);
    when(jpaRepository.findByTokenHash("missing")).thenReturn(Optional.empty());

    assertThat(adapter.findByTokenHash("missing")).isEmpty();
  }
}
