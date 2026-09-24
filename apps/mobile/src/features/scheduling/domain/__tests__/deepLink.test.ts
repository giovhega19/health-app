/**
 * `buildSessionStartDeepLink` (`specs/F04-programacion-recordatorios/plan.md`
 * §1 punto 2): contrato de deep link `fitapp://session/start?slot=<id>` al
 * que apuntan las acciones "Iniciar ahora"/"Iniciar" de las notificaciones
 * `PRE_REMINDER`/`START`.
 *
 * `buildSessionStartDeepLink` (tarea `F04-T05`) devuelve deliberadamente una
 * cadena vacía — rojo TDD esperado: esta prueba falla en la aserción.
 */
import { buildSessionStartDeepLink } from "../deepLink";
import { asId } from "@/shared/domain/Id";

describe("F04 deep link — buildSessionStartDeepLink", () => {
  it("genera fitapp://session/start?slot=<id> para un ScheduleSlot dado", () => {
    const slotId = asId("00000000-0000-4000-e200-000000000001");

    expect(buildSessionStartDeepLink(slotId)).toBe(`fitapp://session/start?slot=${slotId}`);
  });

  it("dos ScheduleSlot distintos producen deep links distintos", () => {
    const first = asId("00000000-0000-4000-e200-000000000002");
    const second = asId("00000000-0000-4000-e200-000000000003");

    expect(buildSessionStartDeepLink(first)).not.toBe(buildSessionStartDeepLink(second));
  });
});
