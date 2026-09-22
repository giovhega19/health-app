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
      json: () => Promise.resolve({ hello: "world" }),
    }) as unknown as typeof fetch;

    const result = await apiClient<{ hello: string }>("https://example.com");

    expect(result).toEqual({ hello: "world" });
  });

  it("lanza un error cuando la respuesta no es ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;

    await expect(apiClient("https://example.com")).rejects.toThrow("HTTP 500");
  });
});
