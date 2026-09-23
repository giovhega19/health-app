/**
 * `SqliteExerciseRepository` (tarea `F02-T08`, integración con SQLite real).
 * CA-02.01.1 (detalle de ejercicio) y CA-02.02.1 (filtros combinados)
 * dependen de que `findById`/`filter` lean del catálogo local persistido.
 */
import { isOk } from "@/shared/domain/Result";
import { SqliteExerciseRepository } from "../SqliteExerciseRepository";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";
import { EXERCISE_IDS, seedExercises } from "@test/fakes/aCatalogSnapshot";

describe("RF-02.01/RF-02.02 SqliteExerciseRepository", () => {
  it("CA-02.01.1 persiste ejercicios y los recupera por id", async () => {
    const db = await createTestDb();
    const repository = new SqliteExerciseRepository(db, new FakeClock("2026-09-22T10:00:00Z"));

    await repository.upsertMany(seedExercises());

    const result = await repository.findById(EXERCISE_IDS.pushUp);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value?.name).toBe("Flexión de pecho");
    expect(result.value?.hasVideo()).toBe(true);
  });

  it("findById devuelve null si el ejercicio no existe", async () => {
    const db = await createTestDb();
    const repository = new SqliteExerciseRepository(db, new FakeClock("2026-09-22T10:00:00Z"));

    const result = await repository.findById(EXERCISE_IDS.pushUp);

    expect(isOk(result) && result.value).toBeNull();
  });

  it("CA-02.02.1 filtra por grupo muscular y equipo combinados", async () => {
    const db = await createTestDb();
    const repository = new SqliteExerciseRepository(db, new FakeClock("2026-09-22T10:00:00Z"));
    await repository.upsertMany(seedExercises());

    const result = await repository.filter({ muscleGroup: "LEGS", equipment: "NONE" });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.map((exercise) => exercise.slug)).toEqual(["zancadas"]);
  });

  it("upsertMany actualiza un ejercicio existente en vez de duplicarlo", async () => {
    const db = await createTestDb();
    const repository = new SqliteExerciseRepository(db, new FakeClock("2026-09-22T10:00:00Z"));
    await repository.upsertMany(seedExercises());

    await repository.upsertMany(seedExercises());
    const all = await repository.filter({});

    expect(isOk(all) && all.value).toHaveLength(seedExercises().length);
  });
});
