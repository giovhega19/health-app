/**
 * CA-04.06.1 Horas de silencio (RN-16): "Dado horas de silencio de 22:00 a
 * 07:00, cuando una notificación que no es de sesión cae a las 23:00,
 * entonces no se entrega en ese momento." Se prueba mediante dos predicados
 * puros que `NotificationPlanner.planNotifications` (F04-T06) deberá
 * componer: `isWithinQuietHours` (incluye el cruce de medianoche) e
 * `isExemptFromQuietHours` (los avisos de sesión son time-critical y no
 * respetan las horas de silencio, igual que RN-16 los exime del tope
 * diario).
 *
 * Ambos predicados (tarea `F04-T06`) lanzan deliberadamente — rojo TDD
 * esperado.
 */
import { isExemptFromQuietHours, isWithinQuietHours } from "../NotificationPlanner";

const QUIET_HOURS = { start: "22:00", end: "07:00" }; // cruza medianoche

describe("CA-04.06.1 NotificationPlanner — horas de silencio", () => {
  it.each([
    { time: "2026-09-21T23:00:00Z", expected: true, label: "23:00, dentro (después del inicio)" },
    { time: "2026-09-21T06:59:00Z", expected: true, label: "06:59, dentro (antes del fin, cruzando medianoche)" },
    { time: "2026-09-21T07:00:00Z", expected: false, label: "07:00, límite de fin, ya fuera" },
    { time: "2026-09-21T21:59:00Z", expected: false, label: "21:59, límite de inicio, todavía fuera" },
    { time: "2026-09-21T22:00:00Z", expected: true, label: "22:00, límite de inicio, ya dentro" },
    { time: "2026-09-21T12:00:00Z", expected: false, label: "mediodía, claramente fuera" },
  ])("$label -> isWithinQuietHours = $expected", ({ time, expected }) => {
    expect(isWithinQuietHours(new Date(time), QUIET_HOURS)).toBe(expected);
  });

  it("sin horas de silencio configuradas (null), nunca está dentro", () => {
    expect(isWithinQuietHours(new Date("2026-09-21T23:00:00Z"), null)).toBe(false);
  });

  it.each([
    { type: "PRE_REMINDER" as const, expected: true },
    { type: "START" as const, expected: true },
    { type: "EXPECTED_END" as const, expected: true },
    { type: "MISSED" as const, expected: false },
  ])(
    "CA-04.06.1 $type exento de horas de silencio = $expected (RN-16: solo los avisos de sesión son time-critical)",
    ({ type, expected }) => {
      expect(isExemptFromQuietHours(type)).toBe(expected);
    },
  );
});
