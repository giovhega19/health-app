import { ok } from "@/shared/domain/Result";
import type { BodyMetricRepository } from "@/features/profile/application/ports";
import type { BodyMetric } from "@/features/profile/domain/BodyMetric";

function sameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

/**
 * Fake en memoria de `BodyMetricRepository`. Reproduce el "upsert por fecha"
 * exigido por CA-01.06.1 ("si ya existía un registro de hoy, se reemplaza")
 * para que `LogBodyWeight.test.ts` lo verifique sin SQLite real
 * (07-estrategia-pruebas.md §2.4). También expone `clear()` (mismo contrato
 * asumido que `FakeProfileRepository`, ver su comentario) para CA-01.08.1.
 */
export class FakeBodyMetricRepository implements BodyMetricRepository {
  private entries: BodyMetric[];
  readonly appendCalls: BodyMetric[] = [];
  clearCalls = 0;

  constructor(seed: BodyMetric[] = []) {
    this.entries = [...seed];
  }

  async append(metric: BodyMetric) {
    this.appendCalls.push(metric);
    const index = this.entries.findIndex((existing) => sameDay(existing.date, metric.date));
    if (index >= 0) {
      this.entries[index] = metric;
    } else {
      this.entries.push(metric);
    }
    return ok(undefined);
  }

  async history() {
    return ok([...this.entries]);
  }

  async clear() {
    this.clearCalls += 1;
    this.entries = [];
    return ok(undefined);
  }

  all(): BodyMetric[] {
    return [...this.entries];
  }
}
