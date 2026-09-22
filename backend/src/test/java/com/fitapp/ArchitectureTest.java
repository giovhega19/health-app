package com.fitapp;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

/** Base architecture rules from 04-arquitectura.md §4, verified with ArchUnit. */
class ArchitectureTest {

  /**
   * A module's {@code domain} package must never depend on Spring, JPA or its own {@code adapters}
   * package. In H0 there is no {@code <module>.domain} package yet (only the empty {@code
   * com.fitapp.shared} kernel), so this rule has nothing to check today and passes vacuously; it
   * starts enforcing for real once F01 adds the first module with a domain layer.
   */
  @Test
  void domainDoesNotDependOnFrameworksOrAdapters() {
    JavaClasses importedClasses = new ClassFileImporter().importPackages("com.fitapp");

    ArchRule rule =
        noClasses()
            .that()
            .resideInAPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("org.springframework..", "jakarta.persistence..", "..adapters..")
            // H0 has no `<module>.domain` package yet, so ArchUnit would otherwise
            // fail with "failed to check any classes". Allow the empty match for
            // now; from F01 onwards real domain classes make this rule effective.
            .allowEmptyShould(true);

    rule.check(importedClasses);
  }
}
