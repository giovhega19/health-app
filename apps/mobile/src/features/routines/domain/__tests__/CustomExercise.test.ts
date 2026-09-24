/**
 * `CustomExercise` (RF-03.07), soporte de CA-03.08.3 (una referencia a un
 * ejercicio inexistente del catálogo se convierte en ejercicio personalizado).
 *
 * Fase roja: `CustomExercise.create` (`F03-T06`) es andamiaje mínimo que
 * siempre devuelve `ok`, incluso con nombre vacío o sin grupos musculares.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { CustomExercise } from "../CustomExercise";

describe("RF-03.07 CustomExercise.create", () => {
  it("crea un ejercicio personalizado válido con nombre, notas, foto y grupos musculares", () => {
    const result = CustomExercise.create({
      id: asId("00000000-0000-4000-c100-000000000001"),
      name: "Fondos en silla",
      notes: "Silla de la cocina, codos a 90°",
      photoUri: "file:///tmp/fondos.jpg",
      muscleGroups: ["ARMS"],
      mode: "REPS",
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.name).toBe("Fondos en silla");
      expect(result.value.mode).toBe("REPS");
    }
  });

  it("rechaza un ejercicio personalizado sin nombre", () => {
    const result = CustomExercise.create({
      id: asId("00000000-0000-4000-c100-000000000002"),
      name: "",
      notes: null,
      photoUri: null,
      muscleGroups: ["CORE"],
      mode: "TIME",
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("NAME_REQUIRED");
    }
  });

  it("rechaza un ejercicio personalizado sin grupos musculares", () => {
    const result = CustomExercise.create({
      id: asId("00000000-0000-4000-c100-000000000003"),
      name: "Ejercicio sin grupo",
      notes: null,
      photoUri: null,
      muscleGroups: [],
      mode: "REPS",
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("NO_MUSCLE_GROUPS");
    }
  });
});
