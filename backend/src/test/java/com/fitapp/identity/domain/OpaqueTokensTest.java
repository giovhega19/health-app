package com.fitapp.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class OpaqueTokensTest {

  @Test
  void generatesDifferentTokensEachTime() {
    assertThat(OpaqueTokens.generate()).isNotEqualTo(OpaqueTokens.generate());
  }

  @Test
  void hashIsDeterministicForTheSameInput() {
    String token = "some-raw-token";

    assertThat(OpaqueTokens.hash(token)).isEqualTo(OpaqueTokens.hash(token));
  }

  @Test
  void hashDiffersForDifferentInputs() {
    assertThat(OpaqueTokens.hash("a")).isNotEqualTo(OpaqueTokens.hash("b"));
  }

  @Test
  void hashIsNeverTheRawTokenItself() {
    String token = "some-raw-token";

    assertThat(OpaqueTokens.hash(token)).isNotEqualTo(token);
  }
}
