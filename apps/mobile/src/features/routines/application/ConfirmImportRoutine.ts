import { err, isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { generateId } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { EventBus } from "@/shared/domain/EventBus";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock } from "@/shared/domain/RoutineBlock";
import type { RoutineItem } from "@/shared/domain/RoutineItem";
import { clampToLimits } from "../domain/RoutineLimits";
import type { RoutineLimitField } from "../domain/RoutineLimits";
import { Routine } from "../domain/Routine";
import type { RoutineImportedEvent } from "../domain/events";
import type { ImportError, ImportWarning, RoutineValidationError, RepositoryError } from "../domain/errors";
import { MAX_FILE_SIZE_BYTES, fitRoutineFileSchema } from "./import/fitRoutineFileSchema";
import type { FitRoutineItem } from "./import/fitRoutineFileSchema";
import type { RoutineRepository } from "./ports";

/**
 * `ConfirmImportRoutine` (CA-03.08.2 "al confirmar se guarda con
 * source = IMPORTED", tarea `F03-T10`). Fase 2 del import de dos fases: re-
 * valida y persiste.
 *
 * CA-03.08.3 (recorte de RN-06 en confirmación, hallazgo de seguridad H2):
 * igual que `PreviewImportRoutine`, recorta `sets`/`targetReps`/
 * `targetSeconds`/`weightKg` fuera de rango con `clampToLimits` ANTES de
 * construir los `RoutineItem`/llamar a `Routine.create()` (que valida en modo
 * estricto y rechazaría, no recortaría). Se recalcula aquí en vez de recibir
 * las advertencias ya calculadas por `PreviewImportRoutine` porque esta clase
 * ya re-valida el archivo completo de forma independiente ("Fase 2 ... re-
 * valida y persiste" arriba): así el evento `RoutineImported` siempre lleva
 * advertencias reales incluso si se confirma sin haber pasado por la vista
 * previa (p. ej. "abrir con la app").
 */
export class ConfirmImportRoutine {
  constructor(
    private readonly repository: RoutineRepository,
    private readonly clock: Clock,
    private readonly eventBus: EventBus,
    private readonly appTimerDefaults: TimerSettings,
  ) {}

  async execute(
    rawContent: string,
    sizeBytes: number,
  ): Promise<Result<Routine, ImportError | RoutineValidationError | RepositoryError>> {
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
      return err({ kind: "INVALID_FORMAT", issues: parsed.error.issues.map((issue) => issue.message) });
    }

    const warnings: ImportWarning[] = [];

    const blocks: RoutineBlock[] = parsed.data.routine.blocks.map((block) => ({
      id: generateId(this.clock),
      type: block.type,
      grouping: block.grouping,
      rounds: block.rounds,
      items: block.items.map((item) => this.resolveItem(item, warnings)),
    }));

    const created = Routine.create({
      id: generateId(this.clock),
      name: parsed.data.routine.name,
      description: null,
      goal: parsed.data.routine.goal,
      level: parsed.data.routine.level,
      source: "IMPORTED",
      timerDefaults: { ...this.appTimerDefaults, ...parsed.data.routine.timerDefaults },
      blocks,
      version: 1,
      updatedAt: this.clock.now(),
      deletedAt: null,
    });
    if (isErr(created)) {
      return created;
    }

    const saveResult = await this.repository.save(created.value);
    if (isErr(saveResult)) {
      return saveResult;
    }

    const event: RoutineImportedEvent = {
      type: "RoutineImported",
      occurredAt: this.clock.now(),
      routineId: created.value.id,
      warnings,
    };
    await this.eventBus.publish(event);

    return ok(created.value);
  }

  /**
   * CA-03.08.3: recorta `sets`/`targetReps`/`targetSeconds`/`weightKg` fuera
   * de RN-06 (mismo criterio que `PreviewImportRoutine.resolveItem`), y
   * acumula advertencias en `warnings`.
   */
  private resolveItem(item: FitRoutineItem, warnings: ImportWarning[]): RoutineItem {
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
      sets,
      targetReps,
      targetSeconds,
      weightKg,
    };
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
