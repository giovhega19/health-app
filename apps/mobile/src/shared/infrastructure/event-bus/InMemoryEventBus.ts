import type { DomainEvent, EventBus, EventHandler } from "@/shared/domain/EventBus";

/**
 * Adaptador real (en memoria, dentro del proceso) del puerto `EventBus`
 * (`shared/domain/EventBus.ts`, `04-arquitectura.md` §3.4). Un único bus
 * compartido por toda la app, construido una vez en `src/composition/container.ts`.
 * No persiste ni sobrevive a un reinicio del proceso: los eventos que deban
 * sobrevivir (p. ej. para `outbox`/sync) los encola explícitamente quien los
 * consume (`features/sync`), no este bus.
 */
export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  publish<TEvent extends DomainEvent>(event: TEvent): void {
    const subscribers = this.handlers.get(event.type);
    if (!subscribers) {
      return;
    }
    for (const handler of subscribers) {
      void handler(event);
    }
  }

  subscribe<TEvent extends DomainEvent>(type: TEvent["type"], handler: EventHandler<TEvent>): () => void {
    const existing = this.handlers.get(type) ?? new Set<EventHandler>();
    existing.add(handler as EventHandler);
    this.handlers.set(type, existing);
    return () => {
      existing.delete(handler as EventHandler);
    };
  }
}
