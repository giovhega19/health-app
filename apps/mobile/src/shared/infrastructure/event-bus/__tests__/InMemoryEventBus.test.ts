import { InMemoryEventBus } from "../InMemoryEventBus";
import type { DomainEvent } from "@/shared/domain/EventBus";

interface PingEvent extends DomainEvent {
  type: "Ping";
  value: number;
}

describe("InMemoryEventBus", () => {
  it("entrega un evento publicado a los suscriptores de su type", async () => {
    const bus = new InMemoryEventBus();
    const received: number[] = [];
    bus.subscribe<PingEvent>("Ping", (event) => {
      received.push(event.value);
    });

    bus.publish<PingEvent>({ type: "Ping", occurredAt: new Date(), value: 42 });
    await Promise.resolve();

    expect(received).toEqual([42]);
  });

  it("no falla si se publica un evento sin suscriptores", () => {
    const bus = new InMemoryEventBus();

    expect(() => bus.publish<PingEvent>({ type: "Ping", occurredAt: new Date(), value: 1 })).not.toThrow();
  });

  it("subscribe() devuelve una función para cancelar la suscripción", async () => {
    const bus = new InMemoryEventBus();
    const received: number[] = [];
    const unsubscribe = bus.subscribe<PingEvent>("Ping", (event) => {
      received.push(event.value);
    });

    unsubscribe();
    bus.publish<PingEvent>({ type: "Ping", occurredAt: new Date(), value: 99 });
    await Promise.resolve();

    expect(received).toEqual([]);
  });

  it("soporta múltiples suscriptores del mismo type", async () => {
    const bus = new InMemoryEventBus();
    const a: number[] = [];
    const b: number[] = [];
    bus.subscribe<PingEvent>("Ping", (event) => {
      a.push(event.value);
    });
    bus.subscribe<PingEvent>("Ping", (event) => {
      b.push(event.value);
    });

    bus.publish<PingEvent>({ type: "Ping", occurredAt: new Date(), value: 7 });
    await Promise.resolve();

    expect(a).toEqual([7]);
    expect(b).toEqual([7]);
  });
});
