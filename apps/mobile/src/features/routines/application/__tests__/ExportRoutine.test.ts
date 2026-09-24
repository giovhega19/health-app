/**
 * `ExportRoutine` — CA-03.08.1 "se genera un archivo .fitroutine.json
 * válido contra el esquema v1 ... se abre la hoja nativa de compartir".
 *
 * Fase roja: la resolución de referencias `CUSTOM` no está implementada
 * todavía (`F03-T10`) — la prueba que cubre un ítem personalizado debe
 * fallar en la aserción.
 */
import { isOk } from "@/shared/domain/Result";
import { Routine } from "../../domain/Routine";
import { fitRoutineFileSchema } from "../import/fitRoutineFileSchema";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeFileGateway } from "@test/fakes/FakeFileGateway";
import { FakeExerciseDisplayLookupPort } from "@test/fakes/FakeExerciseDisplayLookupPort";
import { aRoutine, anItem, nextTestId } from "@test/fakes/aRoutine";
import { ExportRoutine } from "../ExportRoutine";

describe("CA-03.08.1 ExportRoutine", () => {
  it("comparte un archivo .fitroutine.json válido contra el esquema v1 (zod, ADR-009)", async () => {
    const created = Routine.create(aRoutine().withName("Pierna casa").withItems(1).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const fileGateway = new FakeFileGateway();
    const useCase = new ExportRoutine(
      fileGateway,
      new FakeClock("2026-09-23T10:00:00Z"),
      new FakeExerciseDisplayLookupPort(),
    );

    const result = await useCase.execute(created.value);

    expect(isOk(result)).toBe(true);
    expect(fileGateway.sharedFiles).toHaveLength(1);
    const shared = fileGateway.sharedFiles[0]!;
    expect(shared.filename).toMatch(/\.fitroutine\.json$/);

    const parsedContent: unknown = JSON.parse(shared.content);
    const parsed = fitRoutineFileSchema.safeParse(parsedContent);
    expect(parsed.success).toBe(true);
  });

  it("un ítem con exerciseSource='CUSTOM' se exporta con exercise.ref='custom' (no como referencia de catálogo)", async () => {
    const customItem = anItem({ exerciseSource: "CUSTOM" });
    const block = { id: nextTestId(), type: "MAIN" as const, grouping: "STRAIGHT" as const, rounds: 1, items: [customItem] };
    const created = Routine.create(aRoutine().withBlocks([block]).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const fileGateway = new FakeFileGateway();
    const lookup = new FakeExerciseDisplayLookupPort();
    lookup.register(
      { source: "CUSTOM", id: customItem.exerciseId },
      { id: customItem.exerciseId, name: "Fondos en silla", muscleGroups: ["ARMS"], mode: "REPS" },
    );
    const useCase = new ExportRoutine(fileGateway, new FakeClock("2026-09-23T10:00:00Z"), lookup);

    await useCase.execute(created.value);

    const parsedContent = JSON.parse(fileGateway.sharedFiles[0]!.content) as {
      routine: { blocks: { items: { exercise: { ref: string } }[] }[] };
    };
    expect(parsedContent.routine.blocks[0]!.items[0]!.exercise.ref).toBe("custom");
  });
});
