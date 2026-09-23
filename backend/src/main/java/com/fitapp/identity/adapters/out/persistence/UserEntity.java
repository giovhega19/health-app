package com.fitapp.identity.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** JPA entity for {@code identity_users} (table-prefixed logical schema, plan.md §4). */
@Entity
@Table(name = "identity_users")
public class UserEntity {

  @Id private UUID id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "accepted_terms_version", nullable = false)
  private String acceptedTermsVersion;

  @Column(name = "health_data_consent", nullable = false)
  private boolean healthDataConsent;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  protected UserEntity() {}

  public UserEntity(
      UUID id,
      String email,
      String passwordHash,
      String acceptedTermsVersion,
      boolean healthDataConsent,
      Instant createdAt,
      Instant deletedAt) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.acceptedTermsVersion = acceptedTermsVersion;
    this.healthDataConsent = healthDataConsent;
    this.createdAt = createdAt;
    this.deletedAt = deletedAt;
  }

  public UUID getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public String getAcceptedTermsVersion() {
    return acceptedTermsVersion;
  }

  public boolean isHealthDataConsent() {
    return healthDataConsent;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getDeletedAt() {
    return deletedAt;
  }
}
