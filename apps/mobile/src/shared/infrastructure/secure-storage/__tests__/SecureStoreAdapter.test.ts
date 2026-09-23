/**
 * `SecureStoreAdapter` (envoltorio de bajo nivel sobre `expo-secure-store`).
 * El módulo nativo no tiene binding en Jest: se reemplaza por un fake en
 * memoria vía `jest.mock`, igual que `expo-file-system`
 * (`test/helpers/expoFileSystemFake.ts`).
 */
import { SecureStoreAdapter } from "../SecureStoreAdapter";

const mockStore = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

describe("SecureStoreAdapter", () => {
  beforeEach(() => mockStore.clear());

  it("getItem() devuelve null si la clave no existe", async () => {
    const adapter = new SecureStoreAdapter();

    expect(await adapter.getItem("missing")).toBeNull();
  });

  it("setItem()/getItem() guardan y recuperan un valor", async () => {
    const adapter = new SecureStoreAdapter();

    await adapter.setItem("token", "secret-value");

    expect(await adapter.getItem("token")).toBe("secret-value");
  });

  it("deleteItem() borra el valor guardado", async () => {
    const adapter = new SecureStoreAdapter();
    await adapter.setItem("token", "secret-value");

    await adapter.deleteItem("token");

    expect(await adapter.getItem("token")).toBeNull();
  });
});
