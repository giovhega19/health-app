import { asc, eq } from "drizzle-orm";
import { err, ok } from "@/shared/domain/Result";
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
import { predefinedRoutines, routineBlocks, routineItems } from "@/shared/infrastructure/db/schema";
import { PredefinedRoutine } from "../domain/PredefinedRoutine";
import type { PredefinedRoutineRepository, RepositoryError } from "../application/ports";

/**
 * `SqlitePredefinedRoutineRepository` (RF-02.03, tarea `F02-T08`).
 * `predefined_routines`/`routine_blocks`/`routine_items` están normalizadas
 * (`specs/F02-catalogo-propuesta/plan.md` §4: "se elige normalizar... estas
 * tablas serán reutilizadas sin cambios por F03"), así que `all()`/`upsertMany`
 * recomponen/descomponen el árbol `PredefinedRoutine -> RoutineBlock[] ->
 * RoutineItem[]` en varias sentencias.
 */
export class SqlitePredefinedRoutineRepository implements PredefinedRoutineRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {}

  async all(): Promise<Result<PredefinedRoutine[], RepositoryError>> {
    try {
      const routineRows = await this.db.select().from(predefinedRoutines);
      const routines: PredefinedRoutine[] = [];
      for (const routineRow of routineRows) {
        const blockRows = await this.db
          .select()
          .from(routineBlocks)
          .where(eq(routineBlocks.routineId, routineRow.id))
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
              }),
            ),
          });
        }

        routines.push(
          PredefinedRoutine.create({
            id: asId(routineRow.id),
            name: routineRow.name,
            goal: routineRow.goal as FitnessGoal,
            level: routineRow.level as Level,
            timerDefaults: routineRow.timerDefaults as TimerSettings,
            blocks,
            version: routineRow.version,
            updatedAt: new Date(routineRow.updatedAt),
          }),
        );
      }
      return ok(routines);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }

  async upsertMany(routines: PredefinedRoutine[]): Promise<Result<void, RepositoryError>> {
    try {
      const nowIso = this.clock.now().toISOString();
      for (const routine of routines) {
        await this.db
          .insert(predefinedRoutines)
          .values({
            id: routine.id,
            name: routine.name,
            goal: routine.goal,
            level: routine.level,
            timerDefaults: routine.timerDefaults,
            version: routine.version,
            updatedAt: routine.updatedAt.toISOString(),
            deletedAt: null,
          })
          .onConflictDoUpdate({
            target: predefinedRoutines.id,
            set: {
              name: routine.name,
              goal: routine.goal,
              level: routine.level,
              timerDefaults: routine.timerDefaults,
              version: routine.version,
              updatedAt: nowIso,
            },
          });

        // Reescribe bloques/ítems del bloque completo (más simple y correcto
        // que un diff fino; el volumen por rutina es pequeño, `plan.md` §1).
        // Sin `ON DELETE CASCADE` declarado (SQLite lo requiere explícito y
        // `PRAGMA foreign_keys` no está garantizado en todos los adaptadores),
        // se borran primero los ítems de los bloques existentes.
        const existingBlocks = await this.db
          .select({ id: routineBlocks.id })
          .from(routineBlocks)
          .where(eq(routineBlocks.routineId, routine.id));
        for (const existingBlock of existingBlocks) {
          await this.db.delete(routineItems).where(eq(routineItems.blockId, existingBlock.id));
        }
        await this.db.delete(routineBlocks).where(eq(routineBlocks.routineId, routine.id));

        for (const [blockIndex, block] of routine.blocks.entries()) {
          const blockId: Id = block.id;
          await this.db.insert(routineBlocks).values({
            id: blockId,
            routineId: routine.id,
            position: blockIndex,
            type: block.type,
            grouping: block.grouping,
            rounds: block.rounds,
          });

          for (const [itemIndex, item] of block.items.entries()) {
            await this.db.insert(routineItems).values({
              id: item.id,
              blockId,
              position: itemIndex,
              exerciseId: item.exerciseId,
              sets: item.sets,
              targetReps: item.targetReps ?? null,
              targetSeconds: item.targetSeconds ?? null,
              weightKg: item.weightKg ?? null,
              timerOverrides: item.timerOverrides ?? null,
            });
          }
        }
      }
      return ok(undefined);
    } catch (error) {
      return err(toRepositoryError(error));
    }
  }
}

function toRepositoryError(error: unknown): RepositoryError {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "STORAGE_ERROR", message };
}
