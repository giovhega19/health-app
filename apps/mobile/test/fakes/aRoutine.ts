import { asId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import type { RoutineBlock, RoutineBlockType, RoutineGrouping } from "@/shared/domain/RoutineBlock";
import type { RoutineItem } from "@/shared/domain/RoutineItem";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import { Routine } from "@/features/routines/domain/Routine";
import type { RoutineCreateInput, RoutineSource } from "@/features/routines/domain/Routine";

/**
 * Builder de pruebas para `Routine` (07-estrategia-pruebas.md §2.6:
 * "Datos de prueba con builders (`aRoutine().withItems(3).build()`)").
 * Sigue la convención de fixtures ya usada por F01/F02
 * (`test/fakes/aCatalogSnapshot.ts`, `test/fakes/aProfileSnapshot.ts`).
 */
export const DEFAULT_TIMER_DEFAULTS: TimerSettings = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 90,
  restBetweenRoundsSeconds: 120,
  halfwayCue: false,
};

let sequence = 0;

/** UUID determinista y legible, único por llamada dentro del proceso de prueba. */
export function nextTestId(): Id {
  sequence += 1;
  const hex = sequence.toString(16).padStart(12, "0");
  return asId(`00000000-0000-4000-e000-${hex}`);
}

export function anItem(overrides: Partial<RoutineItem> = {}): RoutineItem {
  return {
    id: nextTestId(),
    exerciseId: nextTestId(),
    sets: 3,
    targetReps: 12,
    ...overrides,
  };
}

function aBlock(
  items: RoutineItem[],
  overrides: { type?: RoutineBlockType; grouping?: RoutineGrouping; rounds?: number } = {},
): RoutineBlock {
  return {
    id: nextTestId(),
    type: overrides.type ?? "MAIN",
    grouping: overrides.grouping ?? "STRAIGHT",
    rounds: overrides.rounds ?? 1,
    items,
  };
}

export class RoutineBuilder {
  private nameValue = "Pierna casa";
  private descriptionValue: string | null = null;
  private goalValue: FitnessGoal = "GENERAL_HEALTH";
  private levelValue: Level = "BEGINNER";
  private sourceValue: RoutineSource = "USER";
  private timerDefaultsValue: TimerSettings = { ...DEFAULT_TIMER_DEFAULTS };
  private blocksValue: RoutineBlock[] = [aBlock([anItem()])];

  withName(name: string): this {
    this.nameValue = name;
    return this;
  }

  withoutName(): this {
    this.nameValue = "";
    return this;
  }

  withoutItems(): this {
    this.blocksValue = [aBlock([])];
    return this;
  }

  withItems(count: number): this {
    this.blocksValue = [aBlock(Array.from({ length: count }, () => anItem()))];
    return this;
  }

  withBlocks(blocks: RoutineBlock[]): this {
    this.blocksValue = blocks;
    return this;
  }

  withTimerDefaults(overrides: Partial<TimerSettings>): this {
    this.timerDefaultsValue = { ...this.timerDefaultsValue, ...overrides };
    return this;
  }

  withSource(source: RoutineSource): this {
    this.sourceValue = source;
    return this;
  }

  build(): RoutineCreateInput {
    return {
      id: nextTestId(),
      name: this.nameValue,
      description: this.descriptionValue,
      goal: this.goalValue,
      level: this.levelValue,
      source: this.sourceValue,
      timerDefaults: this.timerDefaultsValue,
      blocks: this.blocksValue,
      version: 1,
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      deletedAt: null,
    };
  }

  /**
   * Construye la entidad `Routine` ya validada (lanza si el fixture es
   * inválido, mismo criterio que `aScheduleSlot`). Vive aquí (no en cada
   * archivo de prueba) para que ningún archivo bajo `src/` necesite importar
   * `Routine` directamente de otra feature (Art. 2.5); `test/` está fuera
   * del alcance de `arch:check` (`package.json`'s `arch:check` solo analiza
   * `src`/`app`).
   */
  buildEntity(overrides: Partial<RoutineCreateInput> = {}): Routine {
    const result = Routine.create({ ...this.build(), ...overrides });
    if (!result.ok) {
      throw new Error(`aRoutine().buildEntity(): fixture inválido (${result.error.kind}).`);
    }
    return result.value;
  }
}

export function aRoutine(): RoutineBuilder {
  return new RoutineBuilder();
}

export { aBlock };
