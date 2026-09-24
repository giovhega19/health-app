import { isOk } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { RoutineItem } from "@/shared/domain/RoutineItem";
import type { Routine } from "../domain/Routine";
import type { FileError } from "../domain/errors";
import { SUPPORTED_SCHEMA_VERSION } from "./import/fitRoutineFileSchema";
import type { ExerciseDisplayLookupPort, FileGateway } from "./ports";

/**
 * `ExportRoutine` (CA-03.08.1 "se genera un archivo .fitroutine.json válido
 * contra el esquema v1 ... se abre la hoja nativa de compartir", tarea
 * `F03-T10`). Usa el puerto `FileGateway`; la validación del propio archivo
 * generado se hace con `fitRoutineFileSchema` (ADR-009) en la prueba, no
 * aquí (Art. 2.3: la app no valida su propia salida en producción, solo la
 * entrada del usuario). Resuelve `exercise.ref` para ítems `CUSTOM`
 * (`RoutineItem.exerciseSource === "CUSTOM"`) vía `ExerciseDisplayLookupPort`
 * en vez de exportarlos siempre como referencia de catálogo.
 */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "rutina"
  );
}

export class ExportRoutine {
  constructor(
    private readonly fileGateway: FileGateway,
    private readonly clock: Clock,
    private readonly exerciseDisplayLookup: ExerciseDisplayLookupPort,
  ) {}

  async execute(routine: Routine): Promise<Result<void, FileError>> {
    const filename = `${slugify(routine.name)}.fitroutine.json`;
    const blocks = await Promise.all(
      routine.blocks.map(async (block) => ({
        type: block.type,
        grouping: block.grouping,
        rounds: block.rounds,
        items: await Promise.all(block.items.map((item) => this.exportItem(item))),
      })),
    );
    const file = {
      schema: "fitapp.routine" as const,
      schemaVersion: SUPPORTED_SCHEMA_VERSION,
      exportedAt: this.clock.now().toISOString(),
      routine: {
        name: routine.name,
        goal: routine.goal,
        level: routine.level,
        timerDefaults: routine.timerDefaults,
        blocks,
      },
    };

    return this.fileGateway.shareFile(filename, JSON.stringify(file));
  }

  private async exportItem(item: RoutineItem): Promise<{
    exercise: { ref: string; name?: string; mode?: string; muscleGroups?: string[] };
    sets: number;
    targetReps?: number;
    targetSeconds?: number;
    weightKg?: number;
    timerOverrides?: RoutineItem["timerOverrides"];
  }> {
    const exercise =
      item.exerciseSource === "CUSTOM"
        ? await this.resolveCustomExerciseRef(item.exerciseId)
        : { ref: `catalog:${item.exerciseId}` };

    return {
      exercise,
      sets: item.sets,
      targetReps: item.targetReps,
      targetSeconds: item.targetSeconds,
      weightKg: item.weightKg,
      timerOverrides: item.timerOverrides,
    };
  }

  private async resolveCustomExerciseRef(
    exerciseId: RoutineItem["exerciseId"],
  ): Promise<{ ref: string; name?: string; mode?: string; muscleGroups?: string[] }> {
    const resolved = await this.exerciseDisplayLookup.resolve({ source: "CUSTOM", id: exerciseId });
    if (!isOk(resolved)) {
      // Puerto sin resolución disponible (dato faltante/borrado): se exporta
      // igualmente como referencia de catálogo, opción segura por defecto
      // que nunca produce un archivo inválido contra el esquema.
      return { ref: `catalog:${exerciseId}` };
    }
    return {
      ref: "custom",
      name: resolved.value.name,
      mode: resolved.value.mode,
      muscleGroups: resolved.value.muscleGroups,
    };
  }
}
