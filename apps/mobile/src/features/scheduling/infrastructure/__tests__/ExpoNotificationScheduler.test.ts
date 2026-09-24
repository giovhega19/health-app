/**
 * `ExpoNotificationScheduler` (tarea `F04-T11`). El módulo nativo
 * `expo-notifications` no tiene binding en Jest: se reemplaza por un fake en
 * memoria vía `jest.mock`, mismo patrón que `SecureStoreAdapter.test.ts`.
 */
import { isErr, isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { ExpoNotificationScheduler } from "../ExpoNotificationScheduler";

const mockState: {
  scheduled: unknown[];
  cancelled: string[];
  permissionStatus: "granted" | "denied" | "undetermined";
  nextId: number;
} = { scheduled: [], cancelled: [], permissionStatus: "undetermined", nextId: 1 };

jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn(async () => {
    mockState.permissionStatus = "granted";
    return { status: mockState.permissionStatus };
  }),
  getPermissionsAsync: jest.fn(async () => ({ status: mockState.permissionStatus })),
  scheduleNotificationAsync: jest.fn(async (input: unknown) => {
    mockState.scheduled.push(input);
    return `os-${mockState.nextId++}`;
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    mockState.cancelled.push(id);
  }),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

describe("ExpoNotificationScheduler", () => {
  beforeEach(() => {
    mockState.scheduled = [];
    mockState.cancelled = [];
    mockState.permissionStatus = "undetermined";
    mockState.nextId = 1;
  });

  it("requestPermission() concede y devuelve GRANTED", async () => {
    const scheduler = new ExpoNotificationScheduler();

    const result = await scheduler.requestPermission();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe("GRANTED");
    }
  });

  it("getPermissionStatus() refleja el estado actual", async () => {
    const scheduler = new ExpoNotificationScheduler();

    expect(await scheduler.getPermissionStatus()).toBe("UNDETERMINED");
    await scheduler.requestPermission();
    expect(await scheduler.getPermissionStatus()).toBe("GRANTED");
  });

  it("schedule() programa una notificación y devuelve el id del SO", async () => {
    const scheduler = new ExpoNotificationScheduler();

    const result = await scheduler.schedule({
      scheduleSlotId: asId("00000000-0000-4000-e200-000000000001"),
      type: "START",
      fireAt: new Date("2026-09-21T18:00:00Z"),
      title: "Pierna casa",
      body: "Es hora de entrenar.",
      deepLink: "fitapp://session/start?slot=00000000-0000-4000-e200-000000000001",
    });

    expect(isOk(result)).toBe(true);
    expect(mockState.scheduled).toHaveLength(1);
  });

  it("cancel() cancela una notificación por su id del SO", async () => {
    const scheduler = new ExpoNotificationScheduler();

    const result = await scheduler.cancel("os-1");

    expect(isOk(result)).toBe(true);
    expect(mockState.cancelled).toContain("os-1");
  });

  it("cancelAll() cancela todas las notificaciones pendientes", async () => {
    const scheduler = new ExpoNotificationScheduler();

    const result = await scheduler.cancelAll();

    expect(isOk(result)).toBe(true);
  });

  it("propaga un error si expo-notifications falla al programar", async () => {
    const scheduler = new ExpoNotificationScheduler();
    const notifications = jest.requireMock("expo-notifications") as {
      scheduleNotificationAsync: jest.Mock;
    };
    notifications.scheduleNotificationAsync.mockRejectedValueOnce(new Error("boom"));

    const result = await scheduler.schedule({
      scheduleSlotId: asId("00000000-0000-4000-e200-000000000002"),
      type: "PRE_REMINDER",
      fireAt: new Date("2026-09-21T17:45:00Z"),
      title: "Pierna casa",
      body: "Tu rutina empieza pronto.",
      deepLink: "fitapp://session/start?slot=00000000-0000-4000-e200-000000000002",
    });

    expect(isErr(result)).toBe(true);
  });
});
