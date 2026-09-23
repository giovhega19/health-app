package com.fitapp.catalog.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for {@code catalog_routines}. {@code timerDefaults}/{@code blocks} are stored as JSON
 * text (serialized/deserialized with Jackson in {@link RoutineRepositoryJpaAdapter}, not a JPA
 * {@code AttributeConverter}, to keep this entity framework-simple) rather than normalized child
 * tables — a deliberate simplification for the H1 seed-sized catalog (plan.md §4 allows either
 * "columna JSON o tablas hijas"; JSON keeps `F02-T06` small while `RecommendationEngine` itself
 * lives client-side in TypeScript and never queries these columns with SQL).
 */
@Entity
@Table(name = "catalog_routines")
public class RoutineEntity {

  @Id private UUID id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String goal;

  @Column(nullable = false)
  private String level;

  @Column(name = "timer_defaults", nullable = false, columnDefinition = "text")
  private String timerDefaultsJson;

  @Column(name = "blocks", nullable = false, columnDefinition = "text")
  private String blocksJson;

  @Column(nullable = false)
  private int version;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected RoutineEntity() {}

  public RoutineEntity(
      UUID id,
      String name,
      String goal,
      String level,
      String timerDefaultsJson,
      String blocksJson,
      int version,
      Instant updatedAt) {
    this.id = id;
    this.name = name;
    this.goal = goal;
    this.level = level;
    this.timerDefaultsJson = timerDefaultsJson;
    this.blocksJson = blocksJson;
    this.version = version;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getGoal() {
    return goal;
  }

  public String getLevel() {
    return level;
  }

  public String getTimerDefaultsJson() {
    return timerDefaultsJson;
  }

  public String getBlocksJson() {
    return blocksJson;
  }

  public int getVersion() {
    return version;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
