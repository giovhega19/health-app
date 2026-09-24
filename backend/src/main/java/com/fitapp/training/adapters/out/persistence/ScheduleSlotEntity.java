package com.fitapp.training.adapters.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** JPA entity for {@code training_schedule_slots}. */
@Entity
@Table(name = "training_schedule_slots")
public class ScheduleSlotEntity {

  @Id private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "routine_id", nullable = false)
  private UUID routineId;

  /** Comma-separated ISO day-of-week numbers (1-7), same simplification as {@code muscleGroups}. */
  @Column(name = "days_of_week", nullable = false)
  private String daysOfWeek;

  @Column(name = "start_time", nullable = false)
  private String startTime;

  @Column(name = "reminder_offset_minutes")
  private Integer reminderOffsetMinutes;

  @Column(nullable = false)
  private boolean active;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected ScheduleSlotEntity() {}

  public ScheduleSlotEntity(
      UUID id,
      UUID userId,
      UUID routineId,
      String daysOfWeek,
      String startTime,
      Integer reminderOffsetMinutes,
      boolean active,
      Instant updatedAt) {
    this.id = id;
    this.userId = userId;
    this.routineId = routineId;
    this.daysOfWeek = daysOfWeek;
    this.startTime = startTime;
    this.reminderOffsetMinutes = reminderOffsetMinutes;
    this.active = active;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getRoutineId() {
    return routineId;
  }

  public String getDaysOfWeek() {
    return daysOfWeek;
  }

  public String getStartTime() {
    return startTime;
  }

  public Integer getReminderOffsetMinutes() {
    return reminderOffsetMinutes;
  }

  public boolean isActive() {
    return active;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
