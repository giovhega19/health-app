/**
 * `ExportRoutine` — prueba adicional de cobertura (Art. 3.2) para la rama de
 * fallback cuando `ExerciseDisplayLookupPort.resolve` falla (referencia
 * CUSTOM no registrada): se exporta como `catalog:<id>` en vez de fallar.
 */
import { isOk } from "@/shared/domain/Result";
import { Routine } from "../../domain/Routine";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeFileGateway } from "@test/fakes/FakeFileGateway";
import { FakeExerciseDisplayLookupPort } from "@test/fakes/FakeExerciseDisplayLookupPort";
import { aRoutine, anItem, nextTestId } from "@test/fakes/aRoutine";
import { ExportRoutine } from "../ExportRoutine";

describe("ExportRoutine — fallback cuando no se puede resolver un ítem CUSTOM", () => {
  it("un ítem CUSTOM sin registrar en el lookup se exporta como catalog:<id> (opción segura por defecto)", async () => {
    const customItem = anItem({ exerciseSource: "CUSTOM" });
    const block = { id: nextTestId(), type: "MAIN" as const, grouping: "STRAIGHT" as const, rounds: 1, items: [customItem] };
    const created = Routine.create(aRoutine().withBlocks([block]).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const fileGateway = new FakeFileGateway();
    const lookup = new FakeExerciseDisplayLookupPort(); // sin registrar nada: resolve() -> NOT_FOUND
    const useCase = new ExportRoutine(fileGateway, new FakeClock("2026-09-23T10:00:00Z"), lookup);

    await useCase.execute(created.value);

    const parsedContent = JSON.parse(fileGateway.sharedFiles[0]!.content) as {
      routine: { blocks: { items: { exercise: { ref: string } }[] }[] };
    };
    expect(parsedContent.routine.blocks[0]!.items[0]!.exercise.ref).toBe(`catalog:${customItem.exerciseId}`);
  });
});
