package com.fitapp;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/**
 * Verifies that the Spring Modulith module structure is valid (Art. 9 / 04-arquitectura.md §4). In
 * H0 the only "module" is the empty {@code com.fitapp.shared} kernel; real business modules
 * (identity, profile, catalog...) are added from F01 onwards.
 */
class ApplicationModulesTest {

  @Test
  void verifyModularStructure() {
    ApplicationModules modules = ApplicationModules.of(FitAppApplication.class);
    modules.verify();
  }
}
