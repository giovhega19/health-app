/** `ListActiveSlots` — calendario semanal (CA-04.01.1). */
import { isErr, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { ScheduleSlot } from "../../domain/ScheduleSlot";
import type { RepositoryError, ScheduleSlotRepository } from "../ports";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";
import { ListActiveSlots } from "../ListActiveSlots";

describe("ListActiveSlots", () => {
  it("lista los slots activos del repositorio", async () => {
    const repository = new FakeScheduleSlotRepository([aScheduleSlot()]);
    const useCase = new ListActiveSlots(repository);

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toHaveLength(1);
  });

  it("propaga el error del repositorio", async () => {
    const failing: ScheduleSlotRepository = {
      save: async () => ok(undefined),
      findById: async () => ok(null),
      cancel: async () => ok(undefined),
      listActive: async (): Promise<Result<ScheduleSlot[], RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<ScheduleSlot[], RepositoryError>,
      clear: async () => ok(undefined),
    };
    const useCase = new ListActiveSlots(failing);

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });
});
