import type { Clock } from "@/shared/domain/Clock";

/**
 * Único punto del código de producción donde se permite leer la hora real
 * (`new Date()`), fuera de `domain`/`application` (Art. 2.4 de la
 * constitución). Se inyecta como `Clock` en `src/composition/container.ts`.
 */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
