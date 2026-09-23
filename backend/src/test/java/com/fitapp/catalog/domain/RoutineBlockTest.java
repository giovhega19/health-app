package com.fitapp.catalog.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * `05-modelo-dominio-reglas.md` §1 (class RoutineBlock). Exercises the record's accessors, equality
 * and string representation directly.
 */
class RoutineBlockTest {

  @Test
  void exposesAllFieldsThroughAccessors() {
    UUID id = UUID.randomUUID();
    RoutineItem item =
        new RoutineItem(UUID.randomUUID(), UUID.randomUUID(), 3, 12, null, null, null);

    RoutineBlock block = new RoutineBlock(id, "AMRAP", "superset", 4, List.of(item));

    assertThat(block.id()).isEqualTo(id);
    assertThat(block.type()).isEqualTo("AMRAP");
    assertThat(block.grouping()).isEqualTo("superset");
    assertThat(block.rounds()).isEqualTo(4);
    assertThat(block.items()).containsExactly(item);
  }

  @Test
  void allowsEmptyItemsList() {
    RoutineBlock block = new RoutineBlock(UUID.randomUUID(), "straight", null, 1, List.of());

    assertThat(block.items()).isEmpty();
    assertThat(block.grouping()).isNull();
  }

  @Test
  void equalsAndHashCodeAreBasedOnAllFields() {
    UUID id = UUID.randomUUID();
    RoutineBlock a = new RoutineBlock(id, "AMRAP", "superset", 4, List.of());
    RoutineBlock b = new RoutineBlock(id, "AMRAP", "superset", 4, List.of());
    RoutineBlock different = new RoutineBlock(id, "AMRAP", "superset", 5, List.of());

    assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
    assertThat(a).isNotEqualTo(different);
  }

  @Test
  void toStringIncludesFieldValues() {
    UUID id = UUID.randomUUID();

    RoutineBlock block = new RoutineBlock(id, "AMRAP", "superset", 4, List.of());

    assertThat(block.toString()).contains(id.toString(), "AMRAP", "superset", "4");
  }
}
