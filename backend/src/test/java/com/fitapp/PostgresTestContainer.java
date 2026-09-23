package com.fitapp;

import org.junit.jupiter.api.Tag;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Shared real PostgreSQL container for {@code @SpringBootTest}/repository integration tests (Art. 3
 * of 00-constitucion.md's testing strategy, `07-estrategia-pruebas.md`: Testcontainers for
 * real-database integration tests, not just fakes). {@code @ServiceConnection} (Spring Boot 3.1+)
 * wires the JDBC URL/credentials automatically — no manual {@code @DynamicPropertySource} needed.
 * One container is started per JVM and reused across every test class that extends this one
 * (Testcontainers' Ryuk reaper cleans it up when the test JVM exits).
 *
 * <p>{@code @Tag("testcontainers")} (inherited by every subclass): these tests require a Docker
 * daemon reachable by Testcontainers. `backend/build.gradle.kts` excludes this tag from the default
 * {@code test}/{@code check} tasks and runs it only via the separate {@code integrationTest} task —
 * see that file for why (some Docker Desktop installations expose an API version their client
 * rejects), so a broken/absent local Docker setup never blocks `./gradlew check`, while CI/dev
 * machines with a working Docker daemon can still run the real thing via {@code ./gradlew
 * integrationTest}.
 */
@Testcontainers
@Tag("testcontainers")
public abstract class PostgresTestContainer {

  @Container @ServiceConnection
  static final PostgreSQLContainer<?> POSTGRES =
      new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"));
}
