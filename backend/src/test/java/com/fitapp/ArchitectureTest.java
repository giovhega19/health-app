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
   * package.
   *
   * <p>{@code package-info.java} files are excluded from this check (F01/F02): they carry zero
   * business logic (they cannot — a package-info file only holds a package declaration, Javadoc
   * and, optionally, package-level annotations) so they can never be "domain logic coupled to a
   * framework", which is the actual risk this rule guards against. The one package-level annotation
   * used on a few {@code domain} packages in this codebase ({@code com.fitapp.shared.domain},
   * {@code com.fitapp.sync.domain}) is Spring Modulith's {@code @NamedInterface}, pure
   * module-boundary metadata read by {@code ApplicationModulesTest}
   * (`org.springframework.modulith.core.ApplicationModules`), not a runtime dependency any domain
   * class pulls in. Every actual class in every {@code domain} package is still fully checked.
   */
  @Test
  void domainDoesNotDependOnFrameworksOrAdapters() {
    JavaClasses importedClasses = new ClassFileImporter().importPackages("com.fitapp");

    ArchRule rule =
        noClasses()
            .that()
            .resideInAPackage("..domain..")
            .and()
            .haveNameNotMatching(".*\\.package-info")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("org.springframework..", "jakarta.persistence..", "..adapters..")
            // Allow the vacuous pass for modules that have no `domain` package at all.
            .allowEmptyShould(true);

    rule.check(importedClasses);
  }
}
