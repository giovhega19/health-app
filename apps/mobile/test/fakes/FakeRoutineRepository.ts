import { ok } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { Routine } from "@/features/routines/domain/Routine";
import type { RoutineRepository } from "@/features/routines/application/ports";

/**
 * Fake en memoria de `RoutineRepository` (`features/routines/application/ports.ts`,
 * `specs/F03-editor-rutinas/plan.md` §3). "Fakes antes que mocks para los
 * puertos de repositorio" (07-estrategia-pruebas.md §2.4).
 */
export class FakeRoutineRepository implements RoutineRepository {
  private readonly byId = new Map<Id, Routine>();
  readonly savedRoutines: Routine[] = [];
  readonly softDeletedIds: Id[] = [];

  constructor(seed: Routine[] = []) {
    for (const routine of seed) {
      this.byId.set(routine.id, routine);
    }
  }

  async save(routine: Routine) {
    this.byId.set(routine.id, routine);
    this.savedRoutines.push(routine);
    return ok(undefined);
  }

  async findById(id: Id) {
    return ok(this.byId.get(id) ?? null);
  }

  async listActive() {
    return ok([...this.byId.values()]);
  }

  async softDelete(id: Id) {
    this.softDeletedIds.push(id);
    this.byId.delete(id);
    return ok(undefined);
  }

  clearCalls = 0;

  async clear() {
    this.clearCalls += 1;
    this.byId.clear();
    return ok(undefined);
  }
}
