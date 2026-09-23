/**
 * Esquema Drizzle de la base de datos local (SQLite vía `expo-sqlite`, ver
 * `04-arquitectura.md` §2 y ADR-002). Vive en `shared/infrastructure/db/`
 * (compartido) porque tanto `profile` (F01) como `catalog` (F02) y `sync`
 * necesitan tablas propias en la misma base de datos física y porque el
 * módulo `outbox` (F01-T08) debe poder referenciarse desde cualquier feature
 * futura sin crear un ciclo de dependencias entre `features/*`.
 *
 * Las tablas se agrupan por feature (comentarios de sección) pero viven en
 * un único archivo para que Drizzle pueda generar una sola migración
 * coherente (`drizzle-kit generate`, ver `drizzle.config.ts`).
 */
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// profile (F01): `profiles`, `body_metrics`
// ---------------------------------------------------------------------------
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  accountId: text("account_id"),
  birthDate: text("birth_date").notNull(),
  gender: text("gender").notNull(),
  heightCm: real("height_cm").notNull(),
  goal: text("goal").notNull(),
  level: text("level").notNull(),
  daysPerWeek: integer("days_per_week").notNull(),
  minutesPerSession: integer("minutes_per_session").notNull(),
  equipment: text("equipment", { mode: "json" }).notNull().$type<string[]>(),
  unitSystem: text("unit_system").notNull(),
  targetWeightKg: real("target_weight_kg"),
  parqFlagged: integer("parq_flagged", { mode: "boolean" }).notNull(),
  healthConsentAt: text("health_consent_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const bodyMetrics = sqliteTable(
  "body_metrics",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull(),
    metricDate: text("metric_date").notNull(),
    weightKg: real("weight_kg").notNull(),
    waistCm: real("waist_cm"),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("body_metrics_profile_date_unique").on(table.profileId, table.metricDate),
  ],
);

// ---------------------------------------------------------------------------
// catalog (F02): `exercises`, `predefined_routines`, `routine_blocks`,
// `routine_items`, `catalog_manifest_state`, `media_cache_entries` (ADR-008)
// ---------------------------------------------------------------------------
export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  muscleGroups: text("muscle_groups", { mode: "json" }).notNull().$type<string[]>(),
  equipment: text("equipment", { mode: "json" }).notNull().$type<string[]>(),
  difficulty: integer("difficulty").notNull(),
  mode: text("mode").notNull(),
  met: real("met").notNull(),
  instructions: text("instructions", { mode: "json" }).notNull().$type<string[]>(),
  commonMistakes: text("common_mistakes", { mode: "json" }).notNull().$type<string[]>(),
  imageUrl: text("image_url").notNull(),
  animationUrl: text("animation_url"),
  videoUrl: text("video_url"),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const predefinedRoutines = sqliteTable("predefined_routines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  goal: text("goal").notNull(),
  level: text("level").notNull(),
  timerDefaults: text("timer_defaults", { mode: "json" }).notNull(),
  version: integer("version").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const routineBlocks = sqliteTable(
  "routine_blocks",
  {
    id: text("id").primaryKey(),
    routineId: text("routine_id").notNull(),
    position: integer("position").notNull(),
    type: text("type").notNull(),
    grouping: text("grouping").notNull(),
    rounds: integer("rounds").notNull(),
  },
  (table) => [index("routine_blocks_routine_id_idx").on(table.routineId)],
);

export const routineItems = sqliteTable(
  "routine_items",
  {
    id: text("id").primaryKey(),
    blockId: text("block_id").notNull(),
    position: integer("position").notNull(),
    exerciseId: text("exercise_id").notNull(),
    sets: integer("sets").notNull(),
    targetReps: integer("target_reps"),
    targetSeconds: integer("target_seconds"),
    weightKg: real("weight_kg"),
    timerOverrides: text("timer_overrides", { mode: "json" }),
  },
  (table) => [index("routine_items_block_id_idx").on(table.blockId)],
);

export const catalogManifestState = sqliteTable("catalog_manifest_state", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  version: integer("version").notNull(),
  exercisesEtag: text("exercises_etag").notNull(),
  routinesEtag: text("routines_etag").notNull(),
  lastSyncedAt: text("last_synced_at").notNull(),
});

/** Metadata LRU de ADR-008 ("Caché de medios con política LRU"). */
export const mediaCacheEntries = sqliteTable("media_cache_entries", {
  remoteUrl: text("remote_url").primaryKey(),
  mediaKind: text("media_kind").notNull(), // IMAGE | ANIMATION | VIDEO
  resourceId: text("resource_id"),
  sourceUpdatedAt: text("source_updated_at"),
  sizeBytes: integer("size_bytes").notNull(),
  localUri: text("local_uri").notNull(),
  lastAccessedAt: text("last_accessed_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// ---------------------------------------------------------------------------
// sync (F01-T08): `outbox` — genérico por `entity`, primer consumidor
// `profile`/`bodyMetric` (ADR-002).
// ---------------------------------------------------------------------------
export const outbox = sqliteTable("outbox", {
  id: text("id").primaryKey(),
  entity: text("entity").notNull(),
  op: text("op").notNull(), // upsert | delete
  entityId: text("entity_id").notNull(),
  payload: text("payload", { mode: "json" }),
  createdAt: text("created_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  status: text("status").notNull().default("pending"), // pending | sent | failed
});

export const syncCursorState = sqliteTable("sync_cursor_state", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cursor: text("cursor"),
  updatedAt: text("updated_at").notNull(),
});

/** Usado por `runMigrations` para saber si el bootstrap ya corrió (ver `migrate.ts`). */
export const schemaVersion = sqliteTable("schema_version", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  version: integer("version").notNull(),
  appliedAt: text("applied_at").notNull(),
});

export const CURRENT_SCHEMA_VERSION = 1;
