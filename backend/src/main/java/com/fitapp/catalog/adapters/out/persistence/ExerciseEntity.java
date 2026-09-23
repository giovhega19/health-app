package com.fitapp.catalog.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** JPA entity for {@code catalog_exercises} (table-prefixed logical schema, plan.md §4). */
@Entity
@Table(name = "catalog_exercises")
public class ExerciseEntity {

  @Id private UUID id;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(nullable = false)
  private String name;

  /** Comma-separated values (kept simple, no array/JSON column type — same choice as `profile`). */
  @Column(name = "muscle_groups", nullable = false)
  private String muscleGroups;

  @Column(nullable = false)
  private String equipment;

  @Column(nullable = false)
  private int difficulty;

  @Column(nullable = false)
  private String mode;

  @Column(nullable = false)
  private double met;

  @Column(nullable = false, columnDefinition = "text")
  private String instructions;

  @Column(name = "common_mistakes", nullable = false, columnDefinition = "text")
  private String commonMistakes;

  @Column(name = "image_url", nullable = false)
  private String imageUrl;

  @Column(name = "animation_url")
  private String animationUrl;

  @Column(name = "video_url")
  private String videoUrl;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected ExerciseEntity() {}

  public ExerciseEntity(
      UUID id,
      String slug,
      String name,
      String muscleGroups,
      String equipment,
      int difficulty,
      String mode,
      double met,
      String instructions,
      String commonMistakes,
      String imageUrl,
      String animationUrl,
      String videoUrl,
      Instant updatedAt) {
    this.id = id;
    this.slug = slug;
    this.name = name;
    this.muscleGroups = muscleGroups;
    this.equipment = equipment;
    this.difficulty = difficulty;
    this.mode = mode;
    this.met = met;
    this.instructions = instructions;
    this.commonMistakes = commonMistakes;
    this.imageUrl = imageUrl;
    this.animationUrl = animationUrl;
    this.videoUrl = videoUrl;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public String getSlug() {
    return slug;
  }

  public String getName() {
    return name;
  }

  public String getMuscleGroups() {
    return muscleGroups;
  }

  public String getEquipment() {
    return equipment;
  }

  public int getDifficulty() {
    return difficulty;
  }

  public String getMode() {
    return mode;
  }

  public double getMet() {
    return met;
  }

  public String getInstructions() {
    return instructions;
  }

  public String getCommonMistakes() {
    return commonMistakes;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public String getAnimationUrl() {
    return animationUrl;
  }

  public String getVideoUrl() {
    return videoUrl;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
