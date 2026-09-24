import { asc, eq, inArray, isNull } from "drizzle-orm";
import { err, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { Id } from "@/shared/domain/Id";
import type { Clock } from "@/shared/domain/Clock";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { RoutineBlock, RoutineBlockType, RoutineGrouping } from "@/shared/domain/RoutineBlock";
import type { RoutineItem } from "@/shared/domain/RoutineItem";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { routineBlocks, routineItems, userRoutines } from "@/shared/infrastructure/db/schema";
import { Routine } from "../domain/Routine";
import type { RoutineSource } from "../domain/Routine";
import type { RepositoryError } from "../domain/errors";
import type { RoutineRepository } from "../application/ports";

/**
 * `SqliteUserRoutineRepository` (RF-03.01…RF-03.06, tarea `F03-T07`).
 * Reutiliza literalmente `routine_blocks`/`routine_items` (F02), con
 * `routine_id` apuntando a `user_routines.id` en vez de
 * `predefined_routines.id` (`specs/F03-editor-rutinas/plan.md` §1) — mismo
 * patrón de reescritura completa de hijos que
 * `SqlitePredefinedRoutineRepository.upsertMany`.
 */
export class SqliteUserRoutineRepository implements RoutineRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async save(routine: Routine): Promise<Result<void, RepositoryError>> {
    try {
      const nowIso = this.clock.now().toISOString();
      const row = {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        goal: routine.goal,
        level: routine.level,
        source: routine.source,
        timerDefaults: routine.timerDefaults,
        version: routine.version,
        updatedAt: nowIso,
        deletedAt: routine.deletedAt ? routine.deletedAt.toISOString() : null,
      };

      await this.db.insert(userRoutines).values(row).onConflictDoUpdate({ target: userRoutines.id, set: row });

      const existingBlocks = await this.db
        .select({ id: routineBlocks.id })
        .from(routineBlocks)
        .where(eq(routineBlocks.routineId, routine.id));
      for (const existingBlock of existingBlocks) {
        await this.db.delete(routineItems).where(eq(routineItems.blockId, existingBlock.id));
      }
      await this.db.delete(routineBlocks).where(eq(routineBlocks.routineId, routine.id));

      for (const [blockIndex, block] of routine.blocks.entries()) {
        await this.db.insert(routineBlocks).values({
          id: block.id,
          routineId: routine.id,
          position: blockIndex,
          type: block.type,
          grouping: block.grouping,
          rounds: block.rounds,
        });

        for (const [itemIndex, item] of block.items.entries()) {
          await this.db.insert(routineItems).values({
            id: item.id,
            blockId: block.id,
            position: itemIndex,
            exerciseId: item.exerciseId,
            sets: item.sets,
            targetReps: item.targetReps ?? null,
            targetSeconds: item.targetSeconds ?? null,
            weightKg: item.weightKg ?? null,
            timerOverrides: item.timerOverrides ?? null,
            exerciseSource: item.exerciseSource ?? "CATALOG",
          });
        }
      }

      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async findById(id: Id): Promise<Result<Routine | null, RepositoryError>> {
    try {
      const rows = await this.db.select().from(userRoutines).where(eq(userRoutines.id, id));
      const row = rows[0];
      if (!row || row.deletedAt) {
        return ok(null);
      }
      const routine = await this.hydrate(row);
      return routine ? ok(routine) : ok(null);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async listActive(): Promise<Result<Routine[], RepositoryError>> {
    try {
      const rows = await this.db.select().from(userRoutines).where(isNull(userRoutines.deletedAt));
      const routines: Routine[] = [];
      for (const row of rows) {
        const routine = await this.hydrate(row);
        if (routine) {
          routines.push(routine);
        }
      }
      return ok(routines);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async softDelete(id: Id): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .update(userRoutines)
        .set({ deletedAt: this.clock.now().toISOString() })
        .where(eq(userRoutines.id, id));
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  /**
   * Borrado físico completo (hallazgo H2), a diferencia de `softDelete` (por
   * id). `routine_blocks`/`routine_items` se comparten con `predefined_routines`
   * (F02, `routineId` sin discriminador de tabla, ver comentario de la
   * clase): hay que acotar el borrado a los bloques/ítems de `user_routines`
   * (vía `IN (ids)`) para no purgar también el catálogo predefinido.
   */
  async clear(): Promise<Result<void, RepositoryError>> {
    try {
      const ids = (await this.db.select({ id: userRoutines.id }).from(userRoutines)).map((row) => row.id);
      if (ids.length > 0) {
        const blockIds = (
          await this.db.select({ id: routineBlocks.id }).from(routineBlocks).where(inArray(routineBlocks.routineId, ids))
        ).map((row) => row.id);
        if (blockIds.length > 0) {
          await this.db.delete(routineItems).where(inArray(routineItems.blockId, blockIds));
        }
        await this.db.delete(routineBlocks).where(inArray(routineBlocks.routineId, ids));
      }
      await this.db.delete(userRoutines);
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  private async hydrate(row: UserRoutineRow): Promise<Routine | null> {
    const blockRows = await this.db
      .select()
      .from(routineBlocks)
      .where(eq(routineBlocks.routineId, row.id))
      .orderBy(asc(routineBlocks.position));

    const blocks: RoutineBlock[] = [];
    for (const blockRow of blockRows) {
      const itemRows = await this.db
        .select()
        .from(routineItems)
        .where(eq(routineItems.blockId, blockRow.id))
        .orderBy(asc(routineItems.position));

      blocks.push({
        id: asId(blockRow.id),
        type: blockRow.type as RoutineBlockType,
        grouping: blockRow.grouping as RoutineGrouping,
        rounds: blockRow.rounds,
        items: itemRows.map(
          (itemRow): RoutineItem => ({
            id: asId(itemRow.id),
            exerciseId: asId(itemRow.exerciseId),
            sets: itemRow.sets,
            targetReps: itemRow.targetReps ?? undefined,
            targetSeconds: itemRow.targetSeconds ?? undefined,
            weightKg: itemRow.weightKg ?? undefined,
            timerOverrides: (itemRow.timerOverrides as TimerSettings | null) ?? undefined,
            exerciseSource: (itemRow.exerciseSource as "CATALOG" | "CUSTOM" | undefined) ?? "CATALOG",
          }),
        ),
      });
    }

    const created = Routine.create({
      id: asId(row.id),
      name: row.name,
      description: row.description,
      goal: row.goal as FitnessGoal,
      level: row.level as Level,
      source: row.source as RoutineSource,
      timerDefaults: row.timerDefaults as TimerSettings,
      blocks,
      version: row.version,
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    });
    return isOk(created) ? created.value : null;
  }
}

interface UserRoutineRow {
  id: string;
  name: string;
  description: string | null;
  goal: string;
  level: string;
  source: string;
  timerDefaults: unknown;
  version: number;
  updatedAt: string;
  deletedAt: string | null;
}

function toRepositoryError(error: unknown): RepositoryError {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "STORAGE_ERROR", message };
}
