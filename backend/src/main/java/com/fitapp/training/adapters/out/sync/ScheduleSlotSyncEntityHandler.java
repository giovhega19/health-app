package com.fitapp.training.adapters.out.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import com.fitapp.sync.domain.SyncEntityHandler;
import com.fitapp.training.domain.ScheduleSlot;
import com.fitapp.training.domain.ScheduleSlotRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link SyncEntityHandler} for {@code entity: "scheduleSlot"} (F04-T10). Same ownership-checked
 * LWW pattern as {@link com.fitapp.training.adapters.out.sync.RoutineSyncEntityHandler} — see its
 * Javadoc.
 */
@Component
public class ScheduleSlotSyncEntityHandler implements SyncEntityHandler {

  private final ScheduleSlotRepository scheduleSlotRepository;
  private final ObjectMapper objectMapper;

  public ScheduleSlotSyncEntityHandler(
      ScheduleSlotRepository scheduleSlotRepository, ObjectMapper objectMapper) {
    this.scheduleSlotRepository = scheduleSlotRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public String supportedEntity() {
    return "scheduleSlot";
  }

  @Override
  @Transactional
  public SyncApplyResult apply(UUID userId, SyncChange change) {
    if (!change.isUpsert()) {
      return applyDelete(userId, change);
    }
    ScheduleSlot existing = scheduleSlotRepository.findById(change.id()).orElse(null);
    if (existing != null && !existing.userId().equals(userId)) {
      return SyncApplyResult.rejected("FORBIDDEN", "This schedule slot belongs to another user.");
    }
    if (existing != null && !change.updatedAt().isAfter(existing.updatedAt())) {
      return SyncApplyResult.ok();
    }
    try {
      ScheduleSlotSyncPayload payload =
          objectMapper.convertValue(change.data(), ScheduleSlotSyncPayload.class);
      ScheduleSlot toSave =
          new ScheduleSlot(
              change.id(),
              userId,
              payload.routineId(),
              payload.daysOfWeek() == null ? List.of() : payload.daysOfWeek(),
              payload.startTime(),
              payload.reminderOffsetMinutes(),
              payload.active(),
              change.updatedAt());
      scheduleSlotRepository.save(toSave);
      return SyncApplyResult.ok();
    } catch (RuntimeException e) {
      return SyncApplyResult.rejected("VALIDATION_ERROR", "Malformed scheduleSlot payload.");
    }
  }

  private SyncApplyResult applyDelete(UUID userId, SyncChange change) {
    ScheduleSlot existing = scheduleSlotRepository.findById(change.id()).orElse(null);
    if (existing == null || !existing.userId().equals(userId)) {
      return SyncApplyResult.ok();
    }
    if (!change.updatedAt().isAfter(existing.updatedAt())) {
      return SyncApplyResult.ok();
    }
    scheduleSlotRepository.deleteById(change.id());
    return SyncApplyResult.ok();
  }

  @Override
  public List<SyncChange> pullSince(UUID userId, Instant since, UUID sinceId, int limit) {
    return scheduleSlotRepository.findByUserIdUpdatedSince(userId, since, limit + 1).stream()
        .filter(slot -> isAfterCursor(slot, since, sinceId))
        .limit(limit)
        .map(this::toChange)
        .toList();
  }

  private static boolean isAfterCursor(ScheduleSlot slot, Instant since, UUID sinceId) {
    return slot.updatedAt().isAfter(since)
        || (slot.updatedAt().equals(since) && slot.id().compareTo(sinceId) > 0);
  }

  private SyncChange toChange(ScheduleSlot slot) {
    Map<String, Object> data =
        objectMapper.convertValue(
            new ScheduleSlotSyncPayload(
                slot.routineId(),
                slot.daysOfWeek(),
                slot.startTime(),
                slot.reminderOffsetMinutes(),
                slot.active()),
            new TypeReference<Map<String, Object>>() {});
    return new SyncChange("scheduleSlot", "upsert", slot.id(), slot.updatedAt(), data);
  }
}
