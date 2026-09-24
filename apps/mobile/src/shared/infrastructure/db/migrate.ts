import { sql } from "drizzle-orm";
import type { AppDatabase } from "./types";
import { CURRENT_SCHEMA_VERSION } from "./schema";

/**
 * Bootstrap del esquema local (`04-arquitectura.md` §2, ADR-002). Ejecuta
 * `CREATE TABLE IF NOT EXISTS` de forma idempotente para todas las tablas de
 * `schema.ts` y registra la versión aplicada en `schema_version`.
 *
 * Decisión de diseño (no requiere ADR, es un detalle de implementación, ver
 * reporte de la ronda que la introdujo): en vez del flujo oficial de
 * `drizzle-kit` (generar un `journal`/carpeta `migrations/` y cargarlo en
 * runtime con `drizzle-orm/expo-sqlite/migrator`), que en Expo managed exige
 * configurar Metro para empaquetar los `.sql` como assets, se usa un runner
 * de bootstrap explícito y versionado a mano. Es equivalente en efecto (crea
 * el mismo esquema) y evita esa complejidad de bundling para el alcance de
 * H1; si el esquema necesita evolucionar con datos existentes (ALTER TABLE
 * con migración de datos), se revisará si conviene adoptar el flujo oficial.
 */
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT,
    birth_date TEXT NOT NULL,
    gender TEXT NOT NULL,
    height_cm REAL NOT NULL,
    goal TEXT NOT NULL,
    level TEXT NOT NULL,
    days_per_week INTEGER NOT NULL,
    minutes_per_session INTEGER NOT NULL,
    equipment TEXT NOT NULL,
    unit_system TEXT NOT NULL,
    target_weight_kg REAL,
    parq_flagged INTEGER NOT NULL,
    health_consent_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS body_metrics (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    metric_date TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    waist_cm REAL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS body_metrics_profile_date_unique ON body_metrics (profile_id, metric_date)`,
  `CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    muscle_groups TEXT NOT NULL,
    equipment TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    mode TEXT NOT NULL,
    met REAL NOT NULL,
    instructions TEXT NOT NULL,
    common_mistakes TEXT NOT NULL,
    image_url TEXT NOT NULL,
    animation_url TEXT,
    video_url TEXT,
    is_custom INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS predefined_routines (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    goal TEXT NOT NULL,
    level TEXT NOT NULL,
    timer_defaults TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS routine_blocks (
    id TEXT PRIMARY KEY NOT NULL,
    routine_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    type TEXT NOT NULL,
    grouping TEXT NOT NULL,
    rounds INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS routine_blocks_routine_id_idx ON routine_blocks (routine_id)`,
  `CREATE TABLE IF NOT EXISTS routine_items (
    id TEXT PRIMARY KEY NOT NULL,
    block_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    exercise_id TEXT NOT NULL,
    sets INTEGER NOT NULL,
    target_reps INTEGER,
    target_seconds INTEGER,
    weight_kg REAL,
    timer_overrides TEXT,
    exercise_source TEXT NOT NULL DEFAULT 'CATALOG'
  )`,
  `CREATE INDEX IF NOT EXISTS routine_items_block_id_idx ON routine_items (block_id)`,
  `CREATE TABLE IF NOT EXISTS user_routines (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT NOT NULL,
    level TEXT NOT NULL,
    source TEXT NOT NULL,
    timer_defaults TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS custom_exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    notes TEXT,
    photo_uri TEXT,
    muscle_groups TEXT NOT NULL,
    mode TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS schedule_slots (
    id TEXT PRIMARY KEY NOT NULL,
    routine_id TEXT NOT NULL,
    days_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    reminder_offset_min INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS planned_notifications (
    id TEXT PRIMARY KEY NOT NULL,
    schedule_slot_id TEXT NOT NULL,
    routine_id TEXT NOT NULL,
    routine_name TEXT NOT NULL,
    type TEXT NOT NULL,
    fire_at TEXT NOT NULL,
    os_notification_id TEXT,
    delivered INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS planned_notifications_slot_id_idx ON planned_notifications (schedule_slot_id)`,
  `CREATE TABLE IF NOT EXISTS scheduling_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,
    max_notifications_per_day INTEGER NOT NULL,
    min_hours_between_routines INTEGER NOT NULL,
    min_hours_same_muscle INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS postpone_counters (
    date TEXT NOT NULL,
    schedule_slot_id TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS postpone_counters_date_slot_unique ON postpone_counters (date, schedule_slot_id)`,
  `CREATE TABLE IF NOT EXISTS catalog_manifest_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL,
    exercises_etag TEXT NOT NULL,
    routines_etag TEXT NOT NULL,
    last_synced_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS media_cache_entries (
    remote_url TEXT PRIMARY KEY NOT NULL,
    media_kind TEXT NOT NULL,
    resource_id TEXT,
    source_updated_at TEXT,
    size_bytes INTEGER NOT NULL,
    local_uri TEXT NOT NULL,
    last_accessed_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS outbox (
    id TEXT PRIMARY KEY NOT NULL,
    entity TEXT NOT NULL,
    op TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT,
    created_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
  )`,
  `CREATE TABLE IF NOT EXISTS sync_cursor_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cursor TEXT,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS schema_version (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL,
    applied_at TEXT NOT NULL
  )`,
];

export async function runMigrations(db: AppDatabase, nowIso: string = new Date().toISOString()): Promise<void> {
  for (const statement of STATEMENTS) {
    await db.run(sql.raw(statement));
  }
  await db.run(
    sql`INSERT INTO schema_version (version, applied_at) VALUES (${CURRENT_SCHEMA_VERSION}, ${nowIso})`,
  );
}
