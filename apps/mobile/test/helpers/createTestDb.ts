import initSqlJs from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { runMigrations } from "@/shared/infrastructure/db/migrate";
import * as schema from "@/shared/infrastructure/db/schema";

/**
 * Base de datos SQLite real para pruebas de integración de repositorios
 * (`SqliteProfileRepository`, `SqliteExerciseRepository`, etc.), construida
 * sobre `sql.js` (SQLite compilado a WASM, sin dependencias nativas, apto
 * para Jest/Node) en vez de `expo-sqlite` (que requiere el runtime nativo de
 * Expo). Mismo dialecto SQL, mismo esquema (`shared/infrastructure/db/schema.ts`,
 * `migrate.ts`): las pruebas ejercitan SQL real (constraints, índices únicos,
 * upserts), no un doble en memoria hecho a mano. Ver el comentario de
 * `shared/infrastructure/db/types.ts` sobre el cast a `AppDatabase`.
 */
export async function createTestDb(): Promise<AppDatabase> {
  const SQL = await initSqlJs();
  const database = new SQL.Database();
  const db = drizzle(database, { schema }) as unknown as AppDatabase;
  await runMigrations(db);
  return db;
}
