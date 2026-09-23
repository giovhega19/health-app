package com.fitapp.sync.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * `06-contratos-api.md` §"sync" (class SyncChange). Exercises the record's accessors, the {@code
 * isUpsert()} helper, equality and string representation directly.
 */
class SyncChangeTest {

  @Test
  void exposesAllFieldsThroughAccessorsForAnUpsert() {
    UUID id = UUID.randomUUID();
    Instant updatedAt = Instant.parse("2026-02-10T10:00:00Z");
    Map<String, Object> data = Map.of("weightKg", 70.5);

    SyncChange change = new SyncChange("bodyMetric", "upsert", id, updatedAt, data);

    assertThat(change.entity()).isEqualTo("bodyMetric");
    assertThat(change.op()).isEqualTo("upsert");
    assertThat(change.id()).isEqualTo(id);
    assertThat(change.updatedAt()).isEqualTo(updatedAt);
    assertThat(change.data()).isEqualTo(data);
  }

  @Test
  void isUpsertReturnsTrueForUpsertOperations() {
    SyncChange upsert =
        new SyncChange(
            "profile", "upsert", UUID.randomUUID(), Instant.now(), Map.of("name", "Ana"));

    assertThat(upsert.isUpsert()).isTrue();
  }

  @Test
  void isUpsertReturnsFalseForDeleteOperationsWithNoData() {
    SyncChange delete = new SyncChange("profile", "delete", UUID.randomUUID(), Instant.now(), null);

    assertThat(delete.isUpsert()).isFalse();
    assertThat(delete.data()).isNull();
  }

  @Test
  void equalsAndHashCodeAreBasedOnAllFields() {
    UUID id = UUID.randomUUID();
    Instant updatedAt = Instant.parse("2026-02-10T10:00:00Z");
    Map<String, Object> data = Map.of("weightKg", 70.5);

    SyncChange a = new SyncChange("bodyMetric", "upsert", id, updatedAt, data);
    SyncChange b = new SyncChange("bodyMetric", "upsert", id, updatedAt, data);
    SyncChange different = new SyncChange("bodyMetric", "delete", id, updatedAt, null);

    assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
    assertThat(a).isNotEqualTo(different);
  }

  @Test
  void toStringIncludesFieldValues() {
    UUID id = UUID.randomUUID();
    Instant updatedAt = Instant.parse("2026-02-10T10:00:00Z");

    SyncChange change = new SyncChange("profile", "delete", id, updatedAt, null);

    assertThat(change.toString()).contains("profile", "delete", id.toString());
  }
}
