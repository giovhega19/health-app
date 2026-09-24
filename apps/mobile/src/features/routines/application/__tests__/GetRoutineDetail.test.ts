/** `GetRoutineDetail` — detalle/editor de una rutina de "Mis rutinas". */
import { isErr, isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { Routine } from "../../domain/Routine";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { aRoutine } from "@test/fakes/aRoutine";
import { GetRoutineDetail } from "../GetRoutineDetail";

describe("GetRoutineDetail", () => {
  it("devuelve la rutina cuando existe", async () => {
    const created = Routine.create(aRoutine().withItems(1).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const repository = new FakeRoutineRepository([created.value]);
    const useCase = new GetRoutineDetail(repository);

    const result = await useCase.execute(created.value.id);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id).toBe(created.value.id);
  });

  it("devuelve NOT_FOUND cuando la rutina no existe", async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new GetRoutineDetail(repository);

    const result = await useCase.execute(asId("00000000-0000-4000-9999-000000000001"));

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("NOT_FOUND");
    }
  });
});
