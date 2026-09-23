package com.fitapp.shared.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The system clock as an injectable port (Art. 2.4 of 00-constitucion.md): application services ask
 * Spring for a {@link Clock} bean instead of calling {@code Instant.now()} directly, so tests can
 * substitute {@code Clock.fixed(...)}.
 */
@Configuration
public class ClockConfig {

  @Bean
  public Clock clock() {
    return Clock.systemUTC();
  }
}
