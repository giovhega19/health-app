package com.fitapp.sync.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SyncCursorTest {

  @Test
  void nullCursorStartsFromTheBeginning() {
    assertThat(SyncCursor.parse(null)).isEqualTo(SyncCursor.START);
  }

  @Test
  void blankCursorStartsFromTheBeginning() {
    assertThat(SyncCursor.parse("  ")).isEqualTo(SyncCursor.START);
  }

  @Test
  void malformedCursorDegradesToTheBeginningInsteadOfFailing() {
    assertThat(SyncCursor.parse("not-a-valid-cursor")).isEqualTo(SyncCursor.START);
  }

  @Test
  void encodingThenParsingRoundTrips() {
    SyncCursor original = new SyncCursor(Instant.parse("2026-02-10T10:00:00Z"), UUID.randomUUID());

    SyncCursor roundTripped = SyncCursor.parse(original.encode());

    assertThat(roundTripped).isEqualTo(original);
  }
}
