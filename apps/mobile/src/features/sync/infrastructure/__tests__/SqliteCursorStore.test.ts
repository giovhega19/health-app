import { SqliteCursorStore } from "../SqliteCursorStore";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";

describe("RF-01.01 SqliteCursorStore", () => {
  it("load() devuelve null si nunca se guardó nada", async () => {
    const db = await createTestDb();
    const store = new SqliteCursorStore(db, new FakeClock("2026-09-22T10:00:00Z"));

    expect(await store.load()).toBeNull();
  });

  it("save() persiste el cursor y load() lo recupera", async () => {
    const db = await createTestDb();
    const store = new SqliteCursorStore(db, new FakeClock("2026-09-22T10:00:00Z"));

    await store.save("cursor-1");
    expect(await store.load()).toBe("cursor-1");

    await store.save("cursor-2");
    expect(await store.load()).toBe("cursor-2");
  });
});
