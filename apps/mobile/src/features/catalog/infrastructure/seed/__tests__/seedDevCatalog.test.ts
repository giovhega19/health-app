/**
 * `seedDevCatalog` (RF-02.05, tarea `F02-T09`): siembra el catálogo local
 * en el primer arranque, idempotente. CA-02.05.1 depende de que el catálogo
 * ya esté disponible localmente para funcionar sin conexión.
 */
import { seedDevCatalogIfEmpty } from "../seedDevCatalog";
import { SqliteExerciseRepository } from "../../SqliteExerciseRepository";
import { SqlitePredefinedRoutineRepository } from "../../SqlitePredefinedRoutineRepository";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";
import { isOk } from "@/shared/domain/Result";

describe("RF-02.05 seedDevCatalog", () => {
  it("CA-02.05.1 siembra ejercicios y rutinas cuando las tablas están vacías", async () => {
    const db = await createTestDb();
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const exerciseRepository = new SqliteExerciseRepository(db, clock);
    const routineRepository = new SqlitePredefinedRoutineRepository(db, clock);

    await seedDevCatalogIfEmpty(exerciseRepository, routineRepository);

    const exercises = await exerciseRepository.filter({});
    const routines = await routineRepository.all();
    expect(isOk(exercises) && exercises.value).toHaveLength(8);
    expect(isOk(routines) && routines.value).toHaveLength(3);
  });

  it("es idempotente: no duplica filas si ya había ejercicios sembrados", async () => {
    const db = await createTestDb();
    const clock = new FakeClock("2026-09-22T10:00:00Z");
    const exerciseRepository = new SqliteExerciseRepository(db, clock);
    const routineRepository = new SqlitePredefinedRoutineRepository(db, clock);

    await seedDevCatalogIfEmpty(exerciseRepository, routineRepository);
    await seedDevCatalogIfEmpty(exerciseRepository, routineRepository);

    const exercises = await exerciseRepository.filter({});
    expect(isOk(exercises) && exercises.value).toHaveLength(8);
  });
});
