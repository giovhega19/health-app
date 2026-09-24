/** `NullLastSessionAdapter` — stub seguro de H2 (RN-13, F05 lo sustituye en H3). */
import { NullLastSessionAdapter } from "../NullLastSessionAdapter";

describe("NullLastSessionAdapter", () => {
  it("siempre devuelve null", async () => {
    const adapter = new NullLastSessionAdapter();
    expect(await adapter.lastSessionFor()).toBeNull();
    expect(await adapter.lastSessionFor("LEGS")).toBeNull();
  });
});
