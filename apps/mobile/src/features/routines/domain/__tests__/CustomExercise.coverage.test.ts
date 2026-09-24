/**
 * `CustomExercise` — prueba adicional de cobertura (Art. 3.2) para los
 * getters (`notes`, `photoUri`, `muscleGroups`) que `CustomExercise.test.ts`
 * (QA) no llega a ejercitar directamente.
 */
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { CustomExercise } from "../CustomExercise";

describe("CustomExercise — getters", () => {
  it("expone notes, photoUri y muscleGroups", () => {
    const result = CustomExercise.create({
      id: asId("00000000-0000-4000-c100-000000000009"),
      name: "Zancadas",
      notes: "Con mancuernas",
      photoUri: "file:///zancadas.jpg",
      muscleGroups: ["LEGS", "CORE"],
      mode: "REPS",
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.notes).toBe("Con mancuernas");
    expect(result.value.photoUri).toBe("file:///zancadas.jpg");
    expect(result.value.muscleGroups).toEqual(["LEGS", "CORE"]);
  });
});
