import { Entity } from "@/shared/domain/Entity";
import { err, isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock } from "@/shared/domain/RoutineBlock";
import type { RoutineItem } from "@/shared/domain/RoutineItem";
import type { RoutineValidationError } from "./errors";
import { validateAgainstLimits } from "./RoutineLimits";

/**
 * `Routine` (RF-03.01…RF-03.06, `05-modelo-dominio-reglas.md` §1 class
 * Routine, RN-06). Agregado inmutable: cada mutación (`addItem`,
 * `setOverrides`, `reorderItems`, `removeItem`) devuelve una **nueva**
 * instancia envuelta en `Result` (`specs/F03-editor-rutinas/plan.md` §2).
 */
export type RoutineSource = "USER" | "PREDEFINED" | "IMPORTED";

export interface RoutineProps {
  name: string;
  description: string | null;
  goal: FitnessGoal;
  level: Level;
  source: RoutineSource;
  timerDefaults: TimerSettings;
  blocks: RoutineBlock[];
  version: number;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface RoutineCreateInput extends RoutineProps {
  id: Id;
}

const MAX_ITEMS_PER_ROUTINE = 40;

/** RN-06: valida los límites numéricos de un único `RoutineItem`. */
function validateItemLimits(item: RoutineItem): RoutineValidationError | null {
  const setsResult = validateAgainstLimits("sets", item.sets);
  if (isErr(setsResult)) {
    return setsResult.error;
  }
  if (item.targetReps !== undefined) {
    const repsResult = validateAgainstLimits("reps", item.targetReps);
    if (isErr(repsResult)) {
      return repsResult.error;
    }
  }
  if (item.targetSeconds !== undefined) {
    const secondsResult = validateAgainstLimits("workSeconds", item.targetSeconds);
    if (isErr(secondsResult)) {
      return secondsResult.error;
    }
  }
  if (item.weightKg !== undefined) {
    const weightResult = validateAgainstLimits("weightKg", item.weightKg);
    if (isErr(weightResult)) {
      return weightResult.error;
    }
  }
  if (item.timerOverrides) {
    const timerError = validateTimerSettingsLimits(item.timerOverrides);
    if (timerError) {
      return timerError;
    }
  }
  return null;
}

/** RN-06: valida los límites numéricos de un `TimerSettings` (defaults u overrides). */
function validateTimerSettingsLimits(timer: TimerSettings): RoutineValidationError | null {
  const prepResult = validateAgainstLimits("prepSeconds", timer.prepSeconds);
  if (isErr(prepResult)) {
    return prepResult.error;
  }
  const restFields: (keyof TimerSettings)[] = [
    "restBetweenSetsSeconds",
    "restBetweenExercisesSeconds",
    "restBetweenRoundsSeconds",
  ];
  for (const field of restFields) {
    const value = timer[field] as number;
    const restResult = validateAgainstLimits("restSeconds", value);
    if (isErr(restResult)) {
      return restResult.error;
    }
  }
  return null;
}

/** RN-06: valida los límites de un `RoutineBlock` (rondas + ítems). */
function validateBlockLimits(block: RoutineBlock): RoutineValidationError | null {
  const roundsResult = validateAgainstLimits("rounds", block.rounds);
  if (isErr(roundsResult)) {
    return roundsResult.error;
  }
  for (const item of block.items) {
    const itemError = validateItemLimits(item);
    if (itemError) {
      return itemError;
    }
  }
  return null;
}

/** RN-06: valida toda la rutina (nombre, ítems, límites de bloques/ítems/timerDefaults). */
function validateRoutine(props: RoutineProps): RoutineValidationError | null {
  if (props.name.trim().length === 0) {
    return { kind: "NAME_REQUIRED" };
  }

  const itemCount = props.blocks.reduce((total, block) => total + block.items.length, 0);
  if (itemCount === 0) {
    return { kind: "NO_ITEMS" };
  }

  const itemsPerRoutineResult = validateAgainstLimits("itemsPerRoutine", itemCount);
  if (isErr(itemsPerRoutineResult)) {
    return itemsPerRoutineResult.error;
  }

  const timerDefaultsError = validateTimerSettingsLimits(props.timerDefaults);
  if (timerDefaultsError) {
    return timerDefaultsError;
  }

  for (const block of props.blocks) {
    const blockError = validateBlockLimits(block);
    if (blockError) {
      return blockError;
    }
  }

  return null;
}

export class Routine extends Entity<RoutineProps> {
  private constructor(id: Id, props: RoutineProps) {
    super(id, props);
  }

  static create(input: RoutineCreateInput): Result<Routine, RoutineValidationError> {
    const { id, ...props } = input;
    const error = validateRoutine(props);
    if (error) {
      return err(error);
    }
    return ok(new Routine(id, { ...props }));
  }

  private withBlocks(blocks: RoutineBlock[]): Result<Routine, RoutineValidationError> {
    const nextProps: RoutineProps = { ...this.props, blocks };
    const error = validateRoutine(nextProps);
    if (error) {
      return err(error);
    }
    return ok(new Routine(this.id, nextProps));
  }

  /**
   * CA-03.02.1: añade `item` al bloque `blockId` (modo TIME/REPS decidido
   * por el propio `RoutineItem` recibido). RN-06: máximo 40 ejercicios por
   * rutina, y los límites numéricos del ítem.
   */
  addItem(blockId: Id, item: RoutineItem): Result<Routine, RoutineValidationError> {
    const blockIndex = this.props.blocks.findIndex((block) => block.id === blockId);
    if (blockIndex === -1) {
      return err({ kind: "BLOCK_NOT_FOUND", blockId: String(blockId) });
    }

    const totalItems = this.itemCount + 1;
    if (totalItems > MAX_ITEMS_PER_ROUTINE) {
      return err({
        kind: "OUT_OF_RANGE",
        field: "itemsPerRoutine",
        value: totalItems,
        min: 1,
        max: MAX_ITEMS_PER_ROUTINE,
      });
    }

    const blocks = this.props.blocks.map((block, index) =>
      index === blockIndex ? { ...block, items: [...block.items, item] } : block,
    );
    return this.withBlocks(blocks);
  }

  /**
   * CA-03.03.1 / RN-05: aplica un override de tiempo al ítem `itemId`. El
   * override se fusiona con el `timerOverrides` existente del ítem (si lo
   * hay) para no perder otros campos ya personalizados.
   */
  setOverrides(itemId: Id, overrides: Partial<TimerSettings>): Result<Routine, RoutineValidationError> {
    let found = false;
    const blocks = this.props.blocks.map((block) => ({
      ...block,
      items: block.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }
        found = true;
        return {
          ...item,
          timerOverrides: { ...(item.timerOverrides ?? this.props.timerDefaults), ...overrides },
        };
      }),
    }));

    if (!found) {
      return err({ kind: "ITEM_NOT_FOUND", itemId: String(itemId) });
    }

    return this.withBlocks(blocks);
  }

  /** CA-03.06.1: reordena los ítems de `blockId` según `orderedItemIds`. */
  reorderItems(blockId: Id, orderedItemIds: Id[]): Result<Routine, RoutineValidationError> {
    const blockIndex = this.props.blocks.findIndex((block) => block.id === blockId);
    if (blockIndex === -1) {
      return err({ kind: "BLOCK_NOT_FOUND", blockId: String(blockId) });
    }

    const block = this.props.blocks[blockIndex]!;
    const itemsById = new Map(block.items.map((item) => [item.id, item] as const));
    const reordered = orderedItemIds
      .map((id) => itemsById.get(id))
      .filter((item): item is RoutineItem => item !== undefined);

    const blocks = this.props.blocks.map((candidate, index) =>
      index === blockIndex ? { ...candidate, items: reordered } : candidate,
    );
    return this.withBlocks(blocks);
  }

  /** CA-03.06.1: quita el ítem `itemId` del bloque `blockId`. */
  removeItem(blockId: Id, itemId: Id): Result<Routine, RoutineValidationError> {
    const blockIndex = this.props.blocks.findIndex((block) => block.id === blockId);
    if (blockIndex === -1) {
      return err({ kind: "BLOCK_NOT_FOUND", blockId: String(blockId) });
    }

    const block = this.props.blocks[blockIndex]!;
    if (!block.items.some((item) => item.id === itemId)) {
      return err({ kind: "ITEM_NOT_FOUND", itemId: String(itemId) });
    }

    const blocks = this.props.blocks.map((candidate, index) =>
      index === blockIndex
        ? { ...candidate, items: candidate.items.filter((item) => item.id !== itemId) }
        : candidate,
    );
    return this.withBlocks(blocks);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get goal(): FitnessGoal {
    return this.props.goal;
  }

  get level(): Level {
    return this.props.level;
  }

  get source(): RoutineSource {
    return this.props.source;
  }

  get timerDefaults(): TimerSettings {
    return this.props.timerDefaults;
  }

  get blocks(): RoutineBlock[] {
    return this.props.blocks;
  }

  get version(): number {
    return this.props.version;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  /** Número total de ítems entre todos los bloques (CA-03.01.2, RN-06). */
  get itemCount(): number {
    return this.props.blocks.reduce((total, block) => total + block.items.length, 0);
  }
}
