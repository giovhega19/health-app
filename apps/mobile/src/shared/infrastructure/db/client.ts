import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import type { AppDatabase } from "./types";
import { runMigrations } from "./migrate";
import * as schema from "./schema";

const DATABASE_NAME = "fitapp.db";

let cached: AppDatabase | null = null;

/**
 * Abre (o reutiliza) la base de datos local `fitapp.db` y aplica el
 * bootstrap de esquema (`migrate.ts`). Único punto de entrada real a
 * `expo-sqlite` en producción: solo se invoca desde `src/composition/container.ts`
 * (Art. 2.6, ningún caso de uso ni pantalla abre la base de datos
 * directamente).
 */
export async function getAppDatabase(): Promise<AppDatabase> {
  if (cached) {
    return cached;
  }
  const sqliteDb = openDatabaseSync(DATABASE_NAME);
  const db = drizzle(sqliteDb, { schema }) as unknown as AppDatabase;
  await runMigrations(db);
  cached = db;
  return db;
}

/** Solo para pruebas/composition en caliente (recarga de Metro). */
export function resetAppDatabaseCache(): void {
  cached = null;
}
