import type { Result } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { OutboxOp } from "../domain/OutboxEntry";
import type { OutboxRepository, RepositoryError } from "./ports";

/**
 * `EnqueueChange` (ADR-002, tarea `F01-T08`): encola un cambio local en el
 * `outbox` para que `PushPendingChanges` lo envíe más adelante. Usado desde
 * `src/composition/container.ts` al suscribirse a `ProfileUpdated`/
 * `BodyWeightLogged` (`specs/F01-perfil-onboarding/plan.md` §3 tabla de
 * eventos), nunca desde una pantalla directamente (Art. 2.6).
 */
export class EnqueueChange {
  constructor(private readonly outbox: OutboxRepository) {}

  async execute(
    entity: string,
    op: OutboxOp,
    entityId: Id,
    payload: Record<string, unknown> | null,
  ): Promise<Result<void, RepositoryError>> {
    return this.outbox.enqueue(entity, op, entityId, payload);
  }
}
