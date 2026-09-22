plugins {
    java
    id("org.springframework.boot") version "3.5.6"
    id("io.spring.dependency-management") version "1.1.7"
    jacoco
    id("com.diffplug.spotless") version "8.10.2"
}

group = "com.fitapp"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

// Spring Modulith is not (yet) shipped as a Gradle plugin; the officially
// supported way to consume it is importing its BOM through dependency
// management and adding the starter artifacts below.
dependencyManagement {
    imports {
        mavenBom("org.springframework.modulith:spring-modulith-bom:1.4.3")
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.modulith:spring-modulith-starter-core")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.modulith:spring-modulith-starter-test")
    testImplementation("com.tngtech.archunit:archunit-junit5:1.4.1")
    // Required by the Spring Boot Gradle plugin since Boot 3.x to discover
    // JUnit 5 tests without emitting a deprecation warning.
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // NOTE (H0 scope, see specs/H0-fundaciones/plan.md §4 and CLAUDE.md rule 5):
    // no datasource, JPA, Flyway, PostgreSQL driver, Spring Security or
    // Testcontainers yet. Those are added contract-first as part of F01's
    // technical plan, once a real module needs persistence/auth.
}

tasks.withType<Test> {
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport)
}

// Bootstrap-only classes with no business logic to cover: the main class
// (only invoked at real runtime startup, not by @SpringBootTest, so its
// `main` line is never exercised) and the currently-empty shared kernel
// package. Both are excluded from coverage counters below so the gates
// measure only classes with actual logic once modules land from F01.
val jacocoBootstrapExclusions = listOf("com/fitapp/FitAppApplication.class", "com/fitapp/shared/**")

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
    classDirectories.setFrom(
        files(
            classDirectories.files.map { dir -> fileTree(dir) { exclude(jacocoBootstrapExclusions) } }
        )
    )
}

// --- JaCoCo coverage gates (Art. 3.2 of 00-constitucion.md) -----------------
//
// Target thresholds: domain >= 90%, application >= 80%, global >= 70%.
//
// H0 only scaffolds an empty `com.fitapp.shared` package and the bootstrap
// `FitAppApplication` class — there is no real domain/application code yet
// (that arrives with F01, see plan.md). Two options were considered to keep
// `./gradlew check` green without code to cover:
//   1) Don't wire `jacocoTestCoverageVerification` into `check` at all in H0,
//      and add the real rules later in F01.
//   2) Define the real rules now, scoped so they have zero matching classes
//      today (and therefore pass trivially — a JaCoCo rule with no matching
//      class produces no violation), and let them start enforcing
//      automatically the moment real domain/application classes land in
//      `com.fitapp.<module>.domain` / `.application`. The bootstrap class and
//      the empty `shared` package are removed from `classDirectories` (see
//      `jacocoBootstrapExclusions` above) — `includes`/`excludes` on a
//      `BUNDLE`-scoped rule are not applied by the Gradle JaCoCo plugin, so
//      filtering `classDirectories` is the reliable way to keep them out of
//      the global gate.
//
// Option 2 was chosen: it documents the real gate now (so nobody has to
// remember to add it later), fails safe (no matches = no failure) and starts
// protecting coverage automatically from the very first F01 commit, with no
// further build-file changes required.
tasks.jacocoTestCoverageVerification {
    dependsOn(tasks.jacocoTestReport)
    classDirectories.setFrom(
        files(
            classDirectories.files.map { dir -> fileTree(dir) { exclude(jacocoBootstrapExclusions) } }
        )
    )
    violationRules {
        rule {
            element = "CLASS"
            includes = listOf("com.fitapp.*.domain.*")
            limit {
                counter = "LINE"
                minimum = "0.90".toBigDecimal()
            }
        }
        rule {
            element = "CLASS"
            includes = listOf("com.fitapp.*.application.*")
            limit {
                counter = "LINE"
                minimum = "0.80".toBigDecimal()
            }
        }
        rule {
            // Global gate, computed over classDirectories with the bootstrap
            // exclusions already applied above.
            element = "BUNDLE"
            limit {
                counter = "LINE"
                minimum = "0.70".toBigDecimal()
            }
        }
    }
}

tasks.check {
    dependsOn(tasks.jacocoTestCoverageVerification)
}

spotless {
    java {
        target("src/**/*.java")
        googleJavaFormat()
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }
}

// The Spotless plugin already wires `spotlessCheck` into `check` by default;
// no extra wiring needed here.
