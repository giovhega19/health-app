import { asId } from "@/shared/domain/Id";
import { isOk } from "@/shared/domain/Result";
import { EnqueueChange } from "../EnqueueChange";
import { FakeOutboxRepository } from "@test/fakes/FakeOutboxRepository";

describe("RF-01.06 EnqueueChange", () => {
  it("encola un cambio en el outbox", async () => {
    const outbox = new FakeOutboxRepository();
    const useCase = new EnqueueChange(outbox);

    const result = await useCase.execute("bodyMetric", "upsert", asId("00000000-0000-4000-b000-000000000003"), {
      weightKg: 60,
    });

    expect(isOk(result)).toBe(true);
    expect(outbox.all()).toHaveLength(1);
    expect(outbox.all()[0]?.entity).toBe("bodyMetric");
  });
});
