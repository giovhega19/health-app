/**
 * `PostponeNotification` — pruebas adicionales de cobertura (Art. 3.2) para
 * las ramas de error de sus tres dependencias (repositorio de contador,
 * scheduler de notificaciones, guardado del contador actualizado).
 */
import { isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { createPostponeCounter } from "../../domain/PostponeCounter";
import type { NotificationError, NotificationScheduler, PlannedNotificationContent, PostponeCounterRepository, RepositoryError } from "../ports";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeNotificationScheduler } from "@test/fakes/FakeNotificationScheduler";
import { FakePostponeCounterRepository } from "@test/fakes/FakePostponeCounterRepository";
import { PostponeNotification } from "../PostponeNotification";

const SLOT_ID = asId("00000000-0000-4000-e200-000000000020");

describe("PostponeNotification — ramas de error", () => {
  it("propaga el error del repositorio de contador al leer", async () => {
    const failingCounterRepository: PostponeCounterRepository = {
      get: async (): Promise<Result<ReturnType<typeof createPostponeCounter>, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<ReturnType<typeof createPostponeCounter>, RepositoryError>,
      save: async () => ok(undefined),
    };
    const useCase = new PostponeNotification({
      postponeCounterRepository: failingCounterRepository,
      notificationScheduler: new FakeNotificationScheduler(),
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-21T18:00:00Z"),
    });

    const result = await useCase.execute({ scheduleSlotId: SLOT_ID, minutes: 30 });

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error del NotificationScheduler al programar", async () => {
    const failingScheduler: NotificationScheduler = {
      requestPermission: async () => ok("GRANTED"),
      getPermissionStatus: async () => "GRANTED",
      schedule: async (_n: PlannedNotificationContent): Promise<Result<string, NotificationError>> =>
        ({ ok: false, error: { kind: "SCHEDULING_FAILED" } }) as Result<string, NotificationError>,
      cancel: async () => ok(undefined),
      cancelAll: async () => ok(undefined),
    };
    const useCase = new PostponeNotification({
      postponeCounterRepository: new FakePostponeCounterRepository([
        { date: "2026-09-21", scheduleSlotId: SLOT_ID, count: 0 },
      ]),
      notificationScheduler: failingScheduler,
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-21T18:00:00Z"),
    });

    const result = await useCase.execute({ scheduleSlotId: SLOT_ID, minutes: 30 });

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error del repositorio de contador al guardar", async () => {
    const savingFailsRepository: PostponeCounterRepository = {
      get: async () => ok(createPostponeCounter("2026-09-21", SLOT_ID)),
      save: async (): Promise<Result<void, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
    };
    const useCase = new PostponeNotification({
      postponeCounterRepository: savingFailsRepository,
      notificationScheduler: new FakeNotificationScheduler(),
      eventBus: new FakeEventBus(),
      clock: new FakeClock("2026-09-21T18:00:00Z"),
    });

    const result = await useCase.execute({ scheduleSlotId: SLOT_ID, minutes: 30 });

    expect(isErr(result)).toBe(true);
  });
});
