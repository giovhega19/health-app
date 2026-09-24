/**
 * `CreateCustomExercise` (RF-03.07, soporte de CA-03.08.3).
 *
 * Fase roja: `CustomExercise.create` (dominio, `F03-T06`) no valida el
 * nombre todavía — la segunda prueba debe fallar en la aserción.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeCustomExerciseRepository } from "@test/fakes/FakeCustomExerciseRepository";
import { CreateCustomExercise } from "../CreateCustomExercise";

describe("RF-03.07 CreateCustomExercise", () => {
  it("crea y persiste un ejercicio personalizado válido", async () => {
    const repository = new FakeCustomExerciseRepository();
    const useCase = new CreateCustomExercise(repository, new FakeClock("2026-09-23T10:00:00Z"));

    const result = await useCase.execute({
      name: "Fondos en silla",
      notes: "Silla de la cocina",
      muscleGroups: ["ARMS"],
      mode: "REPS",
    });

    expect(isOk(result)).toBe(true);
    expect(repository.savedExercises).toHaveLength(1);
  });

  it("rechaza un ejercicio personalizado sin nombre", async () => {
    const repository = new FakeCustomExerciseRepository();
    const useCase = new CreateCustomExercise(repository, new FakeClock("2026-09-23T10:00:00Z"));

    const result = await useCase.execute({ name: "", muscleGroups: ["ARMS"], mode: "REPS" });

    expect(isErr(result)).toBe(true);
    expect(repository.savedExercises).toHaveLength(0);
  });
});
