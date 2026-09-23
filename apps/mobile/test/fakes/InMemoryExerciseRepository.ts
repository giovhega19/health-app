import { ok } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { Exercise } from "@/features/catalog/domain/Exercise";
import type { ExerciseFilter, ExerciseRepository } from "@/features/catalog/application/ports";

/**
 * Fake en memoria de `ExerciseRepository` (puerto de `catalog/application/ports.ts`,
 * `specs/F02-catalogo-propuesta/plan.md` §3). "Fakes antes que mocks para los
 * puertos de repositorio" (07-estrategia-pruebas.md §2.4).
 *
 * Registra las llamadas a `upsertMany` (`upsertedBatches`) para que las
 * pruebas de `DownloadCatalogUpdate` (CA-02.06.1) puedan verificar qué se
 * escribió sin depender de SQLite real.
 */
export class InMemoryExerciseRepository implements ExerciseRepository {
  private readonly byId = new Map<Id, Exercise>();
  readonly upsertedBatches: Exercise[][] = [];

  constructor(seed: Exercise[] = []) {
    for (const exercise of seed) {
      this.byId.set(exercise.id, exercise);
    }
  }

  async findById(id: Id) {
    return ok(this.byId.get(id) ?? null);
  }

  async filter(criteria: ExerciseFilter) {
    const items = [...this.byId.values()].filter((exercise) => {
      const matchesMuscleGroup =
        !criteria.muscleGroup || exercise.muscleGroups.includes(criteria.muscleGroup);
      const matchesEquipment =
        !criteria.equipment || exercise.equipment.includes(criteria.equipment);
      return matchesMuscleGroup && matchesEquipment;
    });
    return ok(items);
  }

  async upsertMany(exercises: Exercise[]) {
    this.upsertedBatches.push(exercises);
    for (const exercise of exercises) {
      this.byId.set(exercise.id, exercise);
    }
    return ok(undefined);
  }

  all(): Exercise[] {
    return [...this.byId.values()];
  }
}
