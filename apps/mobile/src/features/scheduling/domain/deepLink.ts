import type { Id } from "@/shared/domain/Id";

/**
 * `buildSessionStartDeepLink` (`specs/F04-programacion-recordatorios/plan.md`
 * §1 punto 2): construye el deep link `fitapp://session/start?slot=<id>` al
 * que apuntan las acciones "Iniciar ahora"/"Iniciar" de las notificaciones
 * `PRE_REMINDER`/`START`. En H2 solo existe una pantalla placeholder
 * (`SessionDeepLinkPlaceholder.tsx`); F05 (H3) sustituye la pantalla sin
 * tocar este contrato de URL.
 *
 */
export function buildSessionStartDeepLink(scheduleSlotId: Id): string {
  return `fitapp://session/start?slot=${scheduleSlotId}`;
}
