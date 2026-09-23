package com.fitapp.catalog.adapters.out.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.catalog.domain.RoutineBlock;
import com.fitapp.catalog.domain.RoutineItem;
import com.fitapp.catalog.domain.TimerSettings;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Development/test-only catalog seed: 8 placeholder exercises and 3 placeholder routines
 * (`specs/F02-catalogo-propuesta/plan.md` §1 "Contenido de datos" — small representative seed, not
 * the ~60 real exercises the sport professional will author later). Gated by {@code @Profile} so it
 * never runs against a production database; only inserts data if the tables are still empty (safe
 * to run every startup in `dev`/`test`).
 */
@Component
@Profile({"dev", "test"})
public class CatalogDevSeeder implements ApplicationRunner {

  private final ExerciseJpaRepository exerciseJpaRepository;
  private final RoutineJpaRepository routineJpaRepository;
  private final ObjectMapper objectMapper;

  public CatalogDevSeeder(
      ExerciseJpaRepository exerciseJpaRepository,
      RoutineJpaRepository routineJpaRepository,
      ObjectMapper objectMapper) {
    this.exerciseJpaRepository = exerciseJpaRepository;
    this.routineJpaRepository = routineJpaRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    if (exerciseJpaRepository.count() > 0 || routineJpaRepository.count() > 0) {
      return;
    }

    Instant seedTime = Instant.parse("2026-02-01T00:00:00Z");

    UUID pushUp = UUID.randomUUID();
    UUID pullUp = UUID.randomUUID();
    UUID squat = UUID.randomUUID();
    UUID dumbbellShoulderPress = UUID.randomUUID();
    UUID plank = UUID.randomUUID();
    UUID jumpingJacks = UUID.randomUUID();
    UUID dumbbellRow = UUID.randomUUID();
    UUID lunges = UUID.randomUUID();

    exerciseJpaRepository.saveAll(
        List.of(
            exercise(
                pushUp,
                "push-up",
                "Flexión de pecho",
                "CHEST",
                "NONE",
                1,
                "REPS",
                3.8,
                List.of(
                    "Apoya las manos a la anchura de los hombros",
                    "Baja el pecho hasta casi tocar el suelo",
                    "Empuja hasta extender los brazos"),
                List.of("Cadera hundida", "Codos muy abiertos"),
                seedTime),
            exercise(
                pullUp,
                "pull-up",
                "Dominada",
                "BACK",
                "PULL_UP_BAR",
                3,
                "REPS",
                8.0,
                List.of(
                    "Agarra la barra con las palmas hacia adelante",
                    "Sube hasta que la barbilla supere la barra",
                    "Baja de forma controlada"),
                List.of("Impulso con las piernas", "Rango de movimiento incompleto"),
                seedTime),
            exercise(
                squat,
                "squat",
                "Sentadilla",
                "LEGS",
                "NONE",
                1,
                "REPS",
                5.0,
                List.of(
                    "Pies a la anchura de los hombros",
                    "Baja la cadera como si fueras a sentarte",
                    "Sube empujando con los talones"),
                List.of("Rodillas hacia adentro", "Talones se despegan del suelo"),
                seedTime),
            exercise(
                dumbbellShoulderPress,
                "dumbbell-shoulder-press",
                "Press de hombro con mancuerna",
                "SHOULDERS",
                "DUMBBELLS",
                2,
                "REPS",
                4.0,
                List.of(
                    "Sostén una mancuerna en cada mano a la altura de los hombros",
                    "Empuja hacia arriba hasta extender los brazos",
                    "Baja de forma controlada"),
                List.of("Arquear demasiado la espalda", "Bloquear los codos con fuerza"),
                seedTime),
            exercise(
                plank,
                "plank",
                "Plancha",
                "CORE",
                "NONE",
                1,
                "TIME",
                3.0,
                List.of(
                    "Apoya antebrazos y puntas de los pies",
                    "Mantén el cuerpo en línea recta",
                    "Contrae el abdomen"),
                List.of("Cadera muy alta", "Cadera hundida"),
                seedTime),
            exercise(
                jumpingJacks,
                "jumping-jacks",
                "Saltos de tijera",
                "CARDIO",
                "NONE",
                1,
                "TIME",
                7.0,
                List.of(
                    "Salta abriendo piernas y brazos",
                    "Vuelve a la posición inicial",
                    "Mantén un ritmo constante"),
                List.of("Aterrizar con las piernas rígidas", "Perder el ritmo"),
                seedTime),
            exercise(
                dumbbellRow,
                "dumbbell-row",
                "Remo con mancuerna",
                "BACK",
                "DUMBBELLS",
                2,
                "REPS",
                4.5,
                List.of(
                    "Apoya una rodilla y una mano en un banco",
                    "Lleva la mancuerna hacia la cadera",
                    "Baja de forma controlada"),
                List.of("Rotar el torso", "Usar impulso en vez de fuerza de espalda"),
                seedTime),
            exercise(
                lunges,
                "lunges",
                "Zancadas",
                "LEGS",
                "NONE",
                2,
                "REPS",
                4.0,
                List.of(
                    "Da un paso largo hacia adelante",
                    "Baja la rodilla trasera casi hasta el suelo",
                    "Vuelve a la posición inicial"),
                List.of("Rodilla delantera sobrepasa la punta del pie", "Tronco muy inclinado"),
                seedTime)));

    TimerSettings defaultTimer = new TimerSettings(10, 40, 30, 60, 90, true);

    routineJpaRepository.saveAll(
        List.of(
            routine(
                UUID.randomUUID(),
                "Full body sin equipo",
                "LOSE_WEIGHT",
                "BEGINNER",
                defaultTimer,
                List.of(
                    block(
                        "MAIN",
                        "STRAIGHT",
                        3,
                        List.of(
                            item(pushUp, 3, 12, null),
                            item(squat, 3, 15, null),
                            item(plank, 3, null, 30))),
                    block("COOLDOWN", "STRAIGHT", 1, List.of(item(jumpingJacks, 1, null, 60)))),
                1,
                seedTime),
            routine(
                UUID.randomUUID(),
                "Fuerza con mancuernas",
                "MUSCLE_GAIN",
                "INTERMEDIATE",
                defaultTimer,
                List.of(
                    block(
                        "MAIN",
                        "STRAIGHT",
                        4,
                        List.of(
                            item(dumbbellShoulderPress, 4, 10, null),
                            item(dumbbellRow, 4, 10, null),
                            item(lunges, 3, 12, null)))),
                1,
                seedTime),
            routine(
                UUID.randomUUID(),
                "Espalda y tracción",
                "STRENGTH",
                "ADVANCED",
                defaultTimer,
                List.of(
                    block(
                        "MAIN",
                        "STRAIGHT",
                        4,
                        List.of(item(pullUp, 4, 6, null), item(dumbbellRow, 4, 10, null)))),
                1,
                seedTime)));
  }

  private static ExerciseEntity exercise(
      UUID id,
      String slug,
      String name,
      String muscleGroup,
      String equipment,
      int difficulty,
      String mode,
      double met,
      List<String> instructions,
      List<String> commonMistakes,
      Instant updatedAt) {
    return new ExerciseEntity(
        id,
        slug,
        name,
        ExerciseRepositoryJpaAdapter.join(List.of(muscleGroup)),
        ExerciseRepositoryJpaAdapter.join(List.of(equipment)),
        difficulty,
        mode,
        met,
        ExerciseRepositoryJpaAdapter.join(instructions),
        ExerciseRepositoryJpaAdapter.join(commonMistakes),
        "https://cdn.fitapp.dev/img/" + slug + ".png",
        "https://cdn.fitapp.dev/anim/" + slug + ".json",
        null,
        updatedAt);
  }

  private RoutineEntity routine(
      UUID id,
      String name,
      String goal,
      String level,
      TimerSettings timerDefaults,
      List<RoutineBlock> blocks,
      int version,
      Instant updatedAt) {
    try {
      return new RoutineEntity(
          id,
          name,
          goal,
          level,
          objectMapper.writeValueAsString(timerDefaults),
          objectMapper.writeValueAsString(blocks),
          version,
          updatedAt);
    } catch (Exception e) {
      throw new IllegalStateException("Could not serialize seed routine " + name, e);
    }
  }

  private static RoutineBlock block(
      String type, String grouping, int rounds, List<RoutineItem> items) {
    return new RoutineBlock(UUID.randomUUID(), type, grouping, rounds, items);
  }

  private static RoutineItem item(
      UUID exerciseId, int sets, Integer targetReps, Integer targetSeconds) {
    return new RoutineItem(
        UUID.randomUUID(), exerciseId, sets, targetReps, targetSeconds, null, null);
  }
}
