package com.fitapp.training.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for {@code training_user_routines}. {@code timerDefaults}/{@code blocks} are stored as
 * JSON text (serialized/deserialized with Jackson in {@link RoutineRepositoryJpaAdapter}), the same
 * deliberate simplification {@code catalog.adapters.out.persistence.RoutineEntity} (F02) already
 * established for predefined routines (see that class's Javadoc): this module never queries into
 * individual blocks/items with SQL either — every row is an opaque pass-through to/from `sync`
 * (`specs/F03-editor-rutinas/plan.md` §4 leaves "columna JSON o tablas hijas" open as an
 * implementation choice).
 */
@Entity
@Table(name = "training_user_routines")
public class RoutineEntity {

  @Id private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(nullable = false)
  private String name;

  @Column(columnDefinition = "text")
  private String description;

  @Column(nullable = false)
  private String goal;

  @Column(nullable = false)
  private String level;

  @Column(nullable = false)
  private String source;

  @Column(name = "timer_defaults", nullable = false, columnDefinition = "text")
  private String timerDefaultsJson;

  @Column(nullable = false, columnDefinition = "text")
  private String blocksJson;

  @Column(nullable = false)
  private int version;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected RoutineEntity() {}

  public RoutineEntity(
      UUID id,
      UUID userId,
      String name,
      String description,
      String goal,
      String level,
      String source,
      String timerDefaultsJson,
      String blocksJson,
      int version,
      Instant updatedAt) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.description = description;
    this.goal = goal;
    this.level = level;
    this.source = source;
    this.timerDefaultsJson = timerDefaultsJson;
    this.blocksJson = blocksJson;
    this.version = version;
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

  public String getDescription() {
    return description;
  }

  public String getGoal() {
    return goal;
  }

  public String getLevel() {
    return level;
  }

  public String getSource() {
    return source;
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
