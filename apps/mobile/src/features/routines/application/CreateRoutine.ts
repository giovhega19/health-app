import { isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { generateId } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock } from "@/shared/domain/RoutineBlock";
import { estimateRoutineDurationSeconds } from "@/shared/domain/routineDuration";
import { Routine } from "../domain/Routine";
import type { RoutineValidationError, RepositoryError } from "../domain/errors";
import type { RoutineRepository } from "./ports";

/**
 * `CreateRoutine` (CA-03.01.1, CA-03.01.2, CA-03.02.1, tarea `F03-T09`).
 * Orquesta la construcción del agregado `Routine` (invariantes RN-06 en el
 * dominio) y reutiliza `estimateRoutineDurationSeconds` de `shared/domain`
 * (RN-07) para el resumen que se muestra al guardar — no reimplementa el
 * cálculo.
 */
export interface CreateRoutineInput {
  name: string;
  description?: string | null;
  goal: FitnessGoal;
  level: Level;
  timerDefaults: TimerSettings;
  blocks: RoutineBlock[];
}

export interface CreateRoutineOutput {
  routine: Routine;
  estimatedDurationSeconds: number;
}

export class CreateRoutine {
  constructor(
    private readonly repository: RoutineRepository,
    private readonly clock: Clock,
    private readonly appTimerDefaults: TimerSettings,
  ) {}

  async execute(
    input: CreateRoutineInput,
  ): Promise<Result<CreateRoutineOutput, RoutineValidationError | RepositoryError>> {
    const created = Routine.create({
      id: generateId(this.clock),
      name: input.name,
      description: input.description ?? null,
      goal: input.goal,
      level: input.level,
      source: "USER",
      timerDefaults: input.timerDefaults,
      blocks: input.blocks,
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

    const estimatedDurationSeconds = estimateRoutineDurationSeconds(
      { timerDefaults: created.value.timerDefaults, blocks: created.value.blocks },
      this.appTimerDefaults,
    );

    return ok({ routine: created.value, estimatedDurationSeconds });
  }
}
