import { ok } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { PredefinedRoutine } from "@/features/catalog/domain/PredefinedRoutine";
import type { PredefinedRoutineRepository } from "@/features/catalog/application/ports";

/**
 * Fake en memoria de `PredefinedRoutineRepository`
 * (`specs/F02-catalogo-propuesta/plan.md` §3). Registra los lotes de
 * `upsertMany` para las pruebas de `DownloadCatalogUpdate` (CA-02.06.1).
 */
export class InMemoryPredefinedRoutineRepository implements PredefinedRoutineRepository {
  private readonly byId = new Map<Id, PredefinedRoutine>();
  readonly upsertedBatches: PredefinedRoutine[][] = [];

  constructor(seed: PredefinedRoutine[] = []) {
    for (const routine of seed) {
      this.byId.set(routine.id, routine);
    }
  }

  async all() {
    return ok([...this.byId.values()]);
  }

  async upsertMany(routines: PredefinedRoutine[]) {
    this.upsertedBatches.push(routines);
    for (const routine of routines) {
      this.byId.set(routine.id, routine);
    }
    return ok(undefined);
  }
}
