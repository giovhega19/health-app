import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";

/**
 * Tipo de la base de datos local usado por todos los repositorios Drizzle de
 * `features/*\/infrastructure` (`shared/infrastructure/db/`, ver
 * `specs/F01-perfil-onboarding/plan.md` §4 y `specs/F02-catalogo-propuesta/plan.md`
 * §4). En producción se construye sobre `expo-sqlite`
 * (`shared/infrastructure/db/client.ts`); en pruebas de integración
 * (`apps/mobile/test/helpers/createTestDb.ts`) se construye sobre `sql.js`
 * (SQLite compilado a WASM, sin dependencias nativas) y se expone con este
 * mismo tipo mediante un cast documentado, porque ambos drivers implementan
 * la misma superficie síncrona de Drizzle sobre el mismo dialecto SQL
 * (SQLite): la diferencia es solo el binding nativo, no el SQL ejecutado.
 */
export type AppDatabase = ExpoSQLiteDatabase<Record<string, never>>;
