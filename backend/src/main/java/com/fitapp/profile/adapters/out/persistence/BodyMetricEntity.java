package com.fitapp.profile.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** JPA entity for {@code profile_body_metrics}. */
@Entity
@Table(name = "profile_body_metrics")
public class BodyMetricEntity {

  @Id private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "metric_date", nullable = false)
  private LocalDate date;

  @Column(name = "weight_kg", nullable = false)
  private double weightKg;

  @Column(name = "waist_cm")
  private Double waistCm;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected BodyMetricEntity() {}

  public BodyMetricEntity(
      UUID id, UUID userId, LocalDate date, double weightKg, Double waistCm, Instant updatedAt) {
    this.id = id;
    this.userId = userId;
    this.date = date;
    this.weightKg = weightKg;
    this.waistCm = waistCm;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public LocalDate getDate() {
    return date;
  }

  public double getWeightKg() {
    return weightKg;
  }

  public Double getWaistCm() {
    return waistCm;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
