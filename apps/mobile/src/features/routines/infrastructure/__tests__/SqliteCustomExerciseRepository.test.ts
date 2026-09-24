/**
 * `SqliteCustomExerciseRepository` (RF-03.07, tarea `F03-T07`, integración
 * con SQLite real).
 */
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { CustomExercise } from "../../domain/CustomExercise";
import { SqliteCustomExerciseRepository } from "../SqliteCustomExerciseRepository";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";

describe("F03-T07 SqliteCustomExerciseRepository", () => {
  it("guarda un ejercicio personalizado y lo reconstruye con findById", async () => {
    const db = await createTestDb();
    const repository = new SqliteCustomExerciseRepository(db, new FakeClock("2026-09-23T10:00:00Z"));
    const created = CustomExercise.create({
      id: asId("00000000-0000-4000-c100-000000000099"),
      name: "Fondos en silla",
      notes: "Silla de la cocina",
      photoUri: null,
      muscleGroups: ["ARMS"],
      mode: "REPS",
    });
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    await repository.save(created.value);
    const found = await repository.findById(created.value.id);

    expect(isOk(found)).toBe(true);
    if (!isOk(found)) return;
    expect(found.value?.name).toBe("Fondos en silla");
    expect(found.value?.muscleGroups).toEqual(["ARMS"]);
  });

  it("findById devuelve null cuando no existe", async () => {
    const db = await createTestDb();
    const repository = new SqliteCustomExerciseRepository(db, new FakeClock("2026-09-23T10:00:00Z"));

    const found = await repository.findById(asId("00000000-0000-4000-c100-000000000001"));

    expect(isOk(found)).toBe(true);
    if (!isOk(found)) return;
    expect(found.value).toBeNull();
  });
});
