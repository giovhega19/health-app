import type { Id } from "@/shared/domain/Id";

/**
 * `OutboxEntry` (ADR-002 "offline-first + outbox", tarea `F01-T08`): un
 * cambio local pendiente de enviar al servidor (`POST /sync/push`). Genérico
 * por `entity` desde el inicio (`specs/F01-perfil-onboarding/plan.md` §6
 * "riesgo: outbox mal diseñado obligaría a F03/F05 a reescribirlo"): en H1
 * solo se encolan `profile`/`bodyMetric`, pero cualquier feature futura
 * puede reutilizar esta misma forma sin tocar `features/sync`.
 */
export type OutboxOp = "upsert" | "delete";
export type OutboxStatus = "pending" | "sent" | "failed";

export interface OutboxEntryProps {
  entity: string;
  op: OutboxOp;
  entityId: Id;
  payload: Record<string, unknown> | null;
  createdAt: Date;
  attempts: number;
  lastError: string | null;
  status: OutboxStatus;
}

export interface OutboxEntry extends OutboxEntryProps {
  id: Id;
}

export function createOutboxEntry(
  id: Id,
  entity: string,
  op: OutboxOp,
  entityId: Id,
  payload: Record<string, unknown> | null,
  createdAt: Date,
): OutboxEntry {
  return {
    id,
    entity,
    op,
    entityId,
    payload,
    createdAt,
    attempts: 0,
    lastError: null,
    status: "pending",
  };
}
