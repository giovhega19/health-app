import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { generateId } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock } from "@/shared/domain/RoutineBlock";
import type { RoutineItem } from "@/shared/domain/RoutineItem";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import { estimateRoutineDurationSeconds } from "@/shared/domain/routineDuration";
import { clampToLimits } from "../domain/RoutineLimits";
import type { RoutineLimitField } from "../domain/RoutineLimits";
import { MAX_FILE_SIZE_BYTES, SUPPORTED_SCHEMA_VERSION, fitRoutineFileSchema } from "./import/fitRoutineFileSchema";
import type { FitRoutineItem } from "./import/fitRoutineFileSchema";
import type { ImportError, ImportWarning } from "../domain/errors";

/**
 * `PreviewImportRoutine` (CA-03.08.2, CA-03.08.3, CA-03.08.4, tarea
 * `F03-T10`). Fase 1 del import de dos fases (`spec.md` §"Diseño técnico
 * relevante"): parsea y valida sin persistir nada.
 *
 * `knownCatalogExerciseIds` (síncrono, no un puerto async): `execute` debe
 * seguir siendo síncrono (lo exige el flujo de UI de previsualización
 * instantánea), así que la resolución contra el catálogo real no puede
 * hacerse aquí vía `ExerciseDisplayLookupPort` (async). En su lugar,
 * `composition/container.ts` precarga los ids del catálogo local (ya
 * disponible en SQLite) y se los pasa a este caso de uso; sin ese
 * argumento (p. ej. en pruebas unitarias aisladas), cualquier referencia
 * `catalog:<id>` se trata de forma conservadora como no verificable y se
 * convierte a personalizada con advertencia (CA-03.08.3).
 */
export interface RoutineImportPreview {
  name: string;
  goal: FitnessGoal;
  level: Level;
  itemCount: number;
  estimatedDurationSeconds: number;
  warnings: ImportWarning[];
}

export class PreviewImportRoutine {
  constructor(
    private readonly clock: Clock,
    private readonly appTimerDefaults: TimerSettings,
    private readonly knownCatalogExerciseIds: ReadonlySet<string> = new Set(),
  ) {}

  execute(rawContent: string, sizeBytes: number): Result<RoutineImportPreview, ImportError> {
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return err({ kind: "FILE_TOO_LARGE", sizeBytes, maxSizeBytes: MAX_FILE_SIZE_BYTES });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      return err({ kind: "INVALID_FORMAT", issues: ["El archivo no es JSON válido."] });
    }

    const parsed = fitRoutineFileSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return err({
        kind: "INVALID_FORMAT",
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }

    if (parsed.data.schemaVersion > SUPPORTED_SCHEMA_VERSION) {
      return err({
        kind: "UNSUPPORTED_VERSION",
        fileSchemaVersion: parsed.data.schemaVersion,
        supportedSchemaVersion: SUPPORTED_SCHEMA_VERSION,
      });
    }

    const warnings: ImportWarning[] = [];

    const blocks: RoutineBlock[] = parsed.data.routine.blocks.map((block) => ({
      id: generateId(this.clock),
      type: block.type,
      grouping: block.grouping,
      rounds: block.rounds,
      items: block.items.map((item) => this.resolveItem(item, warnings)),
    }));

    const timerDefaults: TimerSettings = { ...this.appTimerDefaults, ...parsed.data.routine.timerDefaults };
    const estimatedDurationSeconds = estimateRoutineDurationSeconds(
      { timerDefaults, blocks },
      this.appTimerDefaults,
    );

    return ok({
      name: parsed.data.routine.name,
      goal: parsed.data.routine.goal,
      level: parsed.data.routine.level,
      itemCount: blocks.reduce((total, block) => total + block.items.length, 0),
      estimatedDurationSeconds,
      warnings,
    });
  }

  /**
   * CA-03.08.3: resuelve `item.exercise` (referencia de catálogo/custom) y
   * recorta valores fuera de RN-06, acumulando advertencias en `warnings`.
   */
  private resolveItem(item: FitRoutineItem, warnings: ImportWarning[]): RoutineItem {
    const exerciseSource = this.resolveExerciseSource(item, warnings);

    const sets = this.clampField("sets", item.sets, item.exercise.ref, warnings);
    const targetReps =
      item.targetReps === undefined ? undefined : this.clampField("reps", item.targetReps, item.exercise.ref, warnings);
    const targetSeconds =
      item.targetSeconds === undefined
        ? undefined
        : this.clampField("workSeconds", item.targetSeconds, item.exercise.ref, warnings);
    const weightKg =
      item.weightKg === undefined ? undefined : this.clampField("weightKg", item.weightKg, item.exercise.ref, warnings);

    return {
      id: generateId(this.clock),
      exerciseId: generateId(this.clock),
      exerciseSource,
      sets,
      targetReps,
      targetSeconds,
      weightKg,
    };
  }

  /** CA-03.08.3: referencia de catálogo no reconocida → CustomExercise + advertencia. */
  private resolveExerciseSource(item: FitRoutineItem, warnings: ImportWarning[]): "CATALOG" | "CUSTOM" {
    if (item.exercise.ref === "custom") {
      return "CUSTOM";
    }

    const catalogId = item.exercise.ref.slice("catalog:".length);
    if (this.knownCatalogExerciseIds.has(catalogId)) {
      return "CATALOG";
    }

    warnings.push({
      kind: "UNKNOWN_EXERCISE_CONVERTED",
      message: `El ejercicio "${catalogId}" no existe en el catálogo local y se convirtió en ejercicio personalizado.`,
      itemRef: item.exercise.ref,
    });
    return "CUSTOM";
  }

  /** CA-03.08.3: recorta `value` con `clampToLimits` (RN-06) y registra advertencia si aplica. */
  private clampField(
    field: RoutineLimitField,
    value: number,
    itemRef: string,
    warnings: ImportWarning[],
  ): number {
    const { value: clamped, clamped: wasClamped } = clampToLimits(field, value);
    if (wasClamped) {
      warnings.push({
        kind: "VALUE_CLAMPED",
        message: `El valor de "${field}" (${value}) se ajustó a ${clamped} (límite de RN-06).`,
        itemRef,
        field,
      });
    }
    return clamped;
  }
}
