package com.fitapp.profile.adapters.out.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.profile.domain.BodyMetric;
import com.fitapp.profile.domain.BodyMetricRepository;
import com.fitapp.profile.domain.ProfileRules;
import com.fitapp.shared.domain.ApiException;
import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import com.fitapp.sync.domain.SyncEntityHandler;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link SyncEntityHandler} for {@code entity: "bodyMetric"} (CA-01.01.1, CA-01.06.1). Identity for
 * conflict resolution is {@code (userId, date)} (matching CA-01.06.1's "si ya existía un registro
 * de hoy, se reemplaza"), not the client-generated {@code SyncChange.id} alone: if a row already
 * exists for that date, its existing id is kept (avoids violating the unique `(user_id,
 * metric_date)` constraint when two devices generate different ids for the same day).
 */
@Component
public class BodyMetricSyncEntityHandler implements SyncEntityHandler {

  private final BodyMetricRepository bodyMetricRepository;
  private final ObjectMapper objectMapper;

  public BodyMetricSyncEntityHandler(
      BodyMetricRepository bodyMetricRepository, ObjectMapper objectMapper) {
    this.bodyMetricRepository = bodyMetricRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public String supportedEntity() {
    return "bodyMetric";
  }

  @Override
  @Transactional
  public SyncApplyResult apply(UUID userId, SyncChange change) {
    if (!change.isUpsert()) {
      return applyDelete(userId, change);
    }
    try {
      BodyMetricSyncPayload payload =
          objectMapper.convertValue(change.data(), BodyMetricSyncPayload.class);
      ProfileRules.requireWeightInRange(payload.weightKg(), "weightKg");
      BodyMetric existing =
          bodyMetricRepository.findByUserIdAndDate(userId, payload.date()).orElse(null);
      if (existing != null && !change.updatedAt().isAfter(existing.updatedAt())) {
        return SyncApplyResult.ok();
      }
      BodyMetric toSave =
          new BodyMetric(
              existing != null ? existing.id() : change.id(),
              userId,
              payload.date(),
              payload.weightKg(),
              payload.waistCm(),
              change.updatedAt());
      bodyMetricRepository.save(toSave);
      return SyncApplyResult.ok();
    } catch (ApiException e) {
      return SyncApplyResult.rejected(e.code(), e.getMessage());
    } catch (RuntimeException e) {
      return SyncApplyResult.rejected("VALIDATION_ERROR", "Malformed bodyMetric payload.");
    }
  }

  private SyncApplyResult applyDelete(UUID userId, SyncChange change) {
    BodyMetric existing = bodyMetricRepository.findById(change.id()).orElse(null);
    if (existing == null || !existing.userId().equals(userId)) {
      // Already gone (or never existed for this user): deleting is idempotent, accept.
      return SyncApplyResult.ok();
    }
    if (!change.updatedAt().isAfter(existing.updatedAt())) {
      return SyncApplyResult.ok();
    }
    bodyMetricRepository.deleteById(change.id());
    return SyncApplyResult.ok();
  }

  @Override
  public List<SyncChange> pullSince(UUID userId, Instant since, UUID sinceId, int limit) {
    return bodyMetricRepository.findByUserIdUpdatedSince(userId, since, limit + 1).stream()
        .filter(metric -> isAfterCursor(metric, since, sinceId))
        .limit(limit)
        .map(this::toChange)
        .toList();
  }

  private static boolean isAfterCursor(BodyMetric metric, Instant since, UUID sinceId) {
    return metric.updatedAt().isAfter(since)
        || (metric.updatedAt().equals(since) && metric.id().compareTo(sinceId) > 0);
  }

  private SyncChange toChange(BodyMetric metric) {
    Map<String, Object> data =
        objectMapper.convertValue(
            new BodyMetricSyncPayload(metric.date(), metric.weightKg(), metric.waistCm()),
            new TypeReference<Map<String, Object>>() {});
    return new SyncChange("bodyMetric", "upsert", metric.id(), metric.updatedAt(), data);
  }
}
