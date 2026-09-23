package com.fitapp.identity.adapters.out.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class Argon2PasswordHasherAdapterTest {

  private final Argon2PasswordHasherAdapter hasher = new Argon2PasswordHasherAdapter();

  @Test
  void hashedPasswordIsNeverTheRawPassword() {
    assertThat(hasher.hash("Sup3rSecret!")).isNotEqualTo("Sup3rSecret!");
  }

  @Test
  void matchesTheCorrectPassword() {
    String hash = hasher.hash("Sup3rSecret!");

    assertThat(hasher.matches("Sup3rSecret!", hash)).isTrue();
  }

  @Test
  void doesNotMatchAWrongPassword() {
    String hash = hasher.hash("Sup3rSecret!");

    assertThat(hasher.matches("wrong-password", hash)).isFalse();
  }

  @Test
  void hashingTheSamePasswordTwiceProducesDifferentSaltedHashes() {
    assertThat(hasher.hash("Sup3rSecret!")).isNotEqualTo(hasher.hash("Sup3rSecret!"));
  }
}
