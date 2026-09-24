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

  /**
   * Espera a que todos los suscriptores terminen (importante para efectos
   * locales que deben quedar garantizados antes de que `publish` resuelva,
   * p. ej. `AccountDeleted` purgando el resto del almacenamiento local, hallazgo
   * H2 "Eliminar cuenta no purga datos locales"). No es una espera de red
   * (Art. 7 de la constitución): los suscriptores solo hacen trabajo local
   * (SQLite/outbox), nunca llaman a la red de forma síncrona con `publish`.
   * Todo publicador de este proceso ya trata `publish` como `await`-able
   * (`EventBus.publish` declara `void | Promise<void>`), así que este cambio
   * no altera ningún contrato existente, solo lo hace determinista.
   */
  async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
    const subscribers = this.handlers.get(event.type);
    if (!subscribers) {
      return;
    }
    await Promise.all([...subscribers].map((handler) => handler(event)));
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
