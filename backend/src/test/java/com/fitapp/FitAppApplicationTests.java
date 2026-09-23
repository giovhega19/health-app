package com.fitapp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/** Full context load against a real (containerized) PostgreSQL, including Flyway migrations. */
@SpringBootTest
class FitAppApplicationTests extends PostgresTestContainer {

  @Test
  void contextLoads() {}
}
