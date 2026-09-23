package com.fitapp.identity.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** JPA entity for {@code identity_refresh_tokens} (rotation, `family_id`, plan.md §4). */
@Entity
@Table(name = "identity_refresh_tokens")
public class RefreshTokenEntity {

  @Id private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "token_hash", nullable = false, unique = true)
  private String tokenHash;

  @Column(name = "family_id", nullable = false)
  private UUID familyId;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  protected RefreshTokenEntity() {}

  public RefreshTokenEntity(
      UUID id,
      UUID userId,
      String tokenHash,
      UUID familyId,
      Instant createdAt,
      Instant expiresAt,
      Instant revokedAt) {
    this.id = id;
    this.userId = userId;
    this.tokenHash = tokenHash;
    this.familyId = familyId;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.revokedAt = revokedAt;
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

  public UUID getFamilyId() {
    return familyId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public Instant getRevokedAt() {
    return revokedAt;
  }
}
