package com.fitapp.identity.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** JPA entity for {@code identity_password_reset_tokens}. */
@Entity
@Table(name = "identity_password_reset_tokens")
public class PasswordResetTokenEntity {

  @Id private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "token_hash", nullable = false, unique = true)
  private String tokenHash;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "used_at")
  private Instant usedAt;

  protected PasswordResetTokenEntity() {}

  public PasswordResetTokenEntity(
      UUID id,
      UUID userId,
      String tokenHash,
      Instant createdAt,
      Instant expiresAt,
      Instant usedAt) {
    this.id = id;
    this.userId = userId;
    this.tokenHash = tokenHash;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.usedAt = usedAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getTokenHash() {
    return tokenHash;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public Instant getUsedAt() {
    return usedAt;
  }
}
