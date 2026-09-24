/**
 * CA-04.06.2 Límite diario (RN-16): "Dado maxNotificationsPerDay = 3 y 3
 * notificaciones ya entregadas, entonces una notificación de reactivación no
 * se entrega hoy." RN-16: "Los recordatorios de sesión y los avisos de
 * intervalo durante una sesión activa no cuentan" — en el vocabulario propio
 * de `NotificationType` de F04, el único tipo no exento es `MISSED` (los
 * avisos completos de reactivación de RN-15 pertenecen a una feature futura
 * de motivación; aquí se verifica la regla de tope tal como F04 la posee).
 *
 * `shouldDeliverGivenDailyCap` (tarea `F04-T06`) lanza deliberadamente —
 * rojo TDD esperado.
 */
import { shouldDeliverGivenDailyCap } from "../NotificationPlanner";

describe("CA-04.06.2 / RN-16 NotificationPlanner — límite diario", () => {
  it.each([
    { type: "PRE_REMINDER" as const, alreadyCounted: 3, max: 3, expected: true },
    { type: "START" as const, alreadyCounted: 5, max: 3, expected: true },
    { type: "EXPECTED_END" as const, alreadyCounted: 10, max: 3, expected: true },
  ])(
    "RN-16: $type nunca cuenta para el tope (ya van $alreadyCounted/$max) -> se entrega igual",
    ({ type, alreadyCounted, max, expected }) => {
      expect(shouldDeliverGivenDailyCap(type, alreadyCounted, max)).toBe(expected);
    },
  );

  it("CA-04.06.2: maxNotificationsPerDay=3 y 3 ya entregadas -> una MISSED (no exenta) no se entrega hoy", () => {
    expect(shouldDeliverGivenDailyCap("MISSED", 3, 3)).toBe(false);
  });

  it("una MISSED todavía por debajo del tope sí se entrega", () => {
    expect(shouldDeliverGivenDailyCap("MISSED", 2, 3)).toBe(true);
  });
});
