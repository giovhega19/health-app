package com.fitapp.training.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** JPA entity for {@code training_custom_exercises} (RF-03.07). */
@Entity
@Table(name = "training_custom_exercises")
public class CustomExerciseEntity {

  @Id private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(nullable = false)
  private String name;

  @Column(columnDefinition = "text")
  private String notes;

  @Column(name = "photo_uri")
  private String photoUri;

  /**
   * Comma-separated values (kept simple, no array/JSON column type — same choice as {@code
   * catalog.adapters.out.persistence.ExerciseEntity}).
   */
  @Column(name = "muscle_groups", nullable = false)
  private String muscleGroups;

  @Column(nullable = false)
  private String mode;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected CustomExerciseEntity() {}

  public CustomExerciseEntity(
      UUID id,
      UUID userId,
      String name,
      String notes,
      String photoUri,
      String muscleGroups,
      String mode,
      Instant updatedAt) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.notes = notes;
    this.photoUri = photoUri;
    this.muscleGroups = muscleGroups;
    this.mode = mode;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getName() {
    return name;
  }

  public String getNotes() {
    return notes;
  }

  public String getPhotoUri() {
    return photoUri;
  }

  public String getMuscleGroups() {
    return muscleGroups;
  }

  public String getMode() {
    return mode;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
