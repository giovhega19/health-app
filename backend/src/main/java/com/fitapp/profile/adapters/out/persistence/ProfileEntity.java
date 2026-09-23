package com.fitapp.profile.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** JPA entity for {@code profile_profiles} (table-prefixed logical schema, plan.md §4). */
@Entity
@Table(name = "profile_profiles")
public class ProfileEntity {

  @Id private UUID id;

  @Column(name = "user_id", nullable = false, unique = true)
  private UUID userId;

  @Column(name = "birth_date", nullable = false)
  private LocalDate birthDate;

  @Column(nullable = false)
  private String gender;

  @Column(name = "height_cm", nullable = false)
  private double heightCm;

  @Column(nullable = false)
  private String goal;

  @Column(nullable = false)
  private String level;

  @Column(name = "days_per_week", nullable = false)
  private int daysPerWeek;

  @Column(name = "minutes_per_session", nullable = false)
  private int minutesPerSession;

  /** Comma-separated {@code Equipment} enum values (kept simple, no array/JSON column type). */
  @Column(nullable = false)
  private String equipment;

  @Column(name = "unit_system", nullable = false)
  private String unitSystem;

  @Column(name = "target_weight_kg")
  private Double targetWeightKg;

  @Column(name = "parq_flagged", nullable = false)
  private boolean parqFlagged;

  @Column(name = "health_consent_at", nullable = false)
  private Instant healthConsentAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected ProfileEntity() {}

  public ProfileEntity(
      UUID id,
      UUID userId,
      LocalDate birthDate,
      String gender,
      double heightCm,
      String goal,
      String level,
      int daysPerWeek,
      int minutesPerSession,
      String equipment,
      String unitSystem,
      Double targetWeightKg,
      boolean parqFlagged,
      Instant healthConsentAt,
      Instant updatedAt) {
    this.id = id;
    this.userId = userId;
    this.birthDate = birthDate;
    this.gender = gender;
    this.heightCm = heightCm;
    this.goal = goal;
    this.level = level;
    this.daysPerWeek = daysPerWeek;
    this.minutesPerSession = minutesPerSession;
    this.equipment = equipment;
    this.unitSystem = unitSystem;
    this.targetWeightKg = targetWeightKg;
    this.parqFlagged = parqFlagged;
    this.healthConsentAt = healthConsentAt;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public LocalDate getBirthDate() {
    return birthDate;
  }

  public String getGender() {
    return gender;
  }

  public double getHeightCm() {
    return heightCm;
  }

  public String getGoal() {
    return goal;
  }

  public String getLevel() {
    return level;
  }

  public int getDaysPerWeek() {
    return daysPerWeek;
  }

  public int getMinutesPerSession() {
    return minutesPerSession;
  }

  public String getEquipment() {
    return equipment;
  }

  public String getUnitSystem() {
    return unitSystem;
  }

  public Double getTargetWeightKg() {
    return targetWeightKg;
  }

  public boolean isParqFlagged() {
    return parqFlagged;
  }

  public Instant getHealthConsentAt() {
    return healthConsentAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
