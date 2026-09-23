import * as SecureStore from "expo-secure-store";

/**
 * Envoltorio de bajo nivel sobre `expo-secure-store` (04-arquitectura.md §2):
 * clave/valor cifrado por el sistema operativo (Keychain en iOS, Keystore en
 * Android). Nunca se guardan tokens en texto plano en SQLite/AsyncStorage
 * (Art. 5 de la constitución). Las features consumen esto a través de un
 * puerto propio (p. ej. `TokenStoragePort` de `profile`), nunca directamente.
 */
export class SecureStoreAdapter {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  async deleteItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
}
