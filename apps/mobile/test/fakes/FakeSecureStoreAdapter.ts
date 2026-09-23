import type { SecureStoreAdapter } from "@/shared/infrastructure/secure-storage";

/**
 * Fake en memoria de `SecureStoreAdapter` (envoltorio de `expo-secure-store`,
 * que no tiene binding nativo en Jest). Instrucción del encargo: "fakes de
 * expo-secure-store/expo-file-system si no son testeables directo en Jest
 * (son válidos ahí, a diferencia de dominio/aplicación)".
 */
export class FakeSecureStoreAdapter implements Pick<SecureStoreAdapter, "getItem" | "setItem" | "deleteItem"> {
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async deleteItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}
