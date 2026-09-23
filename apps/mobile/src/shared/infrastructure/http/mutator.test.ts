import { apiClient } from "./mutator";

describe("apiClient", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("devuelve el cuerpo JSON parseado cuando la respuesta es exitosa", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ hello: "world" })),
    }) as unknown as typeof fetch;

    const result = await apiClient<{ hello: string }>("https://example.com");

    expect(result).toEqual({ hello: "world" });
  });

  it("lanza un error cuando la respuesta no es ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("{}"),
    }) as unknown as typeof fetch;

    await expect(apiClient("https://example.com")).rejects.toThrow("HTTP 500");
  });

  it("devuelve undefined cuando la respuesta exitosa no tiene cuerpo (202/204, p. ej. DELETE /me)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
      text: () => Promise.resolve(""),
    }) as unknown as typeof fetch;

    const result = await apiClient<void>("https://example.com");

    expect(result).toBeUndefined();
  });
});
