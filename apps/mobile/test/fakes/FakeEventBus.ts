import type { DomainEvent, EventBus, EventHandler } from "@/shared/domain/EventBus";

/**
 * Fake en memoria del puerto `EventBus` (04-arquitectura.md §3.4,
 * `shared/domain/EventBus.ts`). Se usa en pruebas de aplicación para
 * inspeccionar qué eventos de dominio se publicaron (p. ej.
 * `ProposalAccepted`, CA-02.04.3), sin necesitar el adaptador real de
 * `shared/infrastructure/event-bus`.
 */
export class FakeEventBus implements EventBus {
  readonly published: DomainEvent[] = [];
  private readonly handlers = new Map<string, EventHandler[]>();

  publish<TEvent extends DomainEvent>(event: TEvent): void {
    this.published.push(event);
    for (const handler of this.handlers.get(event.type) ?? []) {
      void handler(event);
    }
  }

  subscribe<TEvent extends DomainEvent>(
    type: TEvent["type"],
    handler: EventHandler<TEvent>,
  ): () => void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler as EventHandler);
    this.handlers.set(type, list);
    return () => {
      const remaining = (this.handlers.get(type) ?? []).filter((h) => h !== handler);
      this.handlers.set(type, remaining);
    };
  }

  eventsOfType<TEvent extends DomainEvent>(type: TEvent["type"]): TEvent[] {
    return this.published.filter((event): event is TEvent => event.type === type);
  }
}
