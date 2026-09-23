describe("API_BASE_URL", () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
    jest.resetModules();
  });

  it("usa EXPO_PUBLIC_API_BASE_URL cuando está definida", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.fitapp.example/api/v1";
    jest.resetModules();

    const { API_BASE_URL } = await import("../config");

    expect(API_BASE_URL).toBe("https://api.fitapp.example/api/v1");
  });

  it("usa un valor de desarrollo por defecto si no está definida", async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    jest.resetModules();

    const { API_BASE_URL } = await import("../config");

    expect(API_BASE_URL).toBe("http://localhost:8080/api/v1");
  });
});
