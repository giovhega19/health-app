/**
 * Puerto de bus de eventos de dominio en memoria (04-arquitectura.md §3.4).
 * Permite que una feature publique un evento (p. ej.
 * `WorkoutSessionCompleted`) y que otras se suscriban a él (`gamification`,
 * `progress`, `mascot`) sin importar los internos de la primera (Art. 9.2
 * de la constitución). Sin implementación de adaptador todavía: llega en
 * `shared/infrastructure/event-bus` cuando la primera feature lo necesite.
 */
export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
}

export type EventHandler<TEvent extends DomainEvent = DomainEvent> = (
  event: TEvent,
) => void | Promise<void>;

export interface EventBus {
  publish<TEvent extends DomainEvent>(event: TEvent): void | Promise<void>;
  /** Devuelve una función para cancelar la suscripción. */
  subscribe<TEvent extends DomainEvent>(
    type: TEvent["type"],
    handler: EventHandler<TEvent>,
  ): () => void;
}
