import { asc, eq, sql } from "drizzle-orm";
import { Directory, File, Paths } from "expo-file-system";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { Clock } from "@/shared/domain/Clock";
import type { AppDatabase } from "@/shared/infrastructure/db/types";
import { mediaCacheEntries } from "@/shared/infrastructure/db/schema";
import type { LocalUri, MediaCacheError, MediaCachePort, MediaKind, MediaRef } from "../application/ports";

/**
 * `MediaCacheAdapter` (ADR-008 "Caché de medios con política LRU sobre
 * `expo-file-system`", tarea `F02-T12`). Implementa `MediaCachePort` sobre
 * `expo-file-system` (directorio `${Paths.cache}media-cache/`) + metadata en
 * SQLite/Drizzle (`media_cache_entries`, `schema.ts`). Solo el `mediaKind`
 * `VIDEO` es evictable (límite 300 MB); imágenes/animaciones nunca se purgan.
 */
const VIDEO_LIMIT_BYTES = 300 * 1024 * 1024;
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m3u8", "webm"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
const ANIMATION_EXTENSIONS = new Set(["gif"]);

export class MediaCacheAdapter implements MediaCachePort {
  private readonly directory: Directory;

  constructor(
    private readonly db: AppDatabase,
    private readonly clock: Clock,
  ) {
    this.directory = new Directory(Paths.cache, "media-cache");
    if (!this.directory.exists) {
      this.directory.create({ intermediates: true });
    }
  }

  async ensureCached(mediaRef: MediaRef): Promise<Result<LocalUri, MediaCacheError>> {
    const kind = mediaRef.kind ?? inferKind(mediaRef.remoteUrl);
    const existing = await this.findEntry(mediaRef.remoteUrl);

    if (existing && isInvalidated(existing, mediaRef.resourceUpdatedAt)) {
      await this.deleteEntry(existing.remoteUrl, existing.localUri);
    } else if (existing) {
      const file = new File(existing.localUri);
      if (file.exists) {
        await this.touch(existing.remoteUrl);
        return ok(existing.localUri);
      }
      // El SO purgó el archivo de `cacheDirectory` sin que lo supiera la
      // política propia (ADR-008 "Negativas / a vigilar"): se trata como un
      // fallo de caché normal y se reintenta la descarga más abajo.
      await this.deleteEntry(existing.remoteUrl, existing.localUri);
    }

    return this.download(mediaRef.remoteUrl, kind);
  }

  async evictLeastRecentlyUsed(bytesNeeded: number): Promise<void> {
    await this.evictVideosUntilUnder(bytesNeeded);
  }

  private async download(remoteUrl: string, kind: MediaKind): Promise<Result<LocalUri, MediaCacheError>> {
    const fileName = `${stableHash(remoteUrl)}${extensionOf(remoteUrl)}`;
    const destination = new File(this.directory, fileName);

    let downloaded: File;
    try {
      downloaded = await File.downloadFileAsync(remoteUrl, destination, { idempotent: true });
    } catch {
      return err({ kind: "NETWORK_UNAVAILABLE" });
    }

    const nowIso = this.clock.now().toISOString();
    const sizeBytes = downloaded.size ?? 0;

    await this.db
      .insert(mediaCacheEntries)
      .values({
        remoteUrl,
        mediaKind: kind,
        resourceId: null,
        sourceUpdatedAt: null,
        sizeBytes,
        localUri: downloaded.uri,
        lastAccessedAt: nowIso,
        createdAt: nowIso,
      })
      .onConflictDoUpdate({
        target: mediaCacheEntries.remoteUrl,
        set: { sizeBytes, localUri: downloaded.uri, lastAccessedAt: nowIso, mediaKind: kind },
      });

    if (kind === "VIDEO") {
      // Purga síncrona inmediatamente después de cada descarga de video
      // exitosa, antes de que el SO pueda intervenir (ADR-008 "Decisión").
      await this.evictVideosUntilUnder(0);
    }

    return ok(downloaded.uri);
  }

  private async evictVideosUntilUnder(bytesNeeded: number): Promise<void> {
    while (true) {
      const totalRow = await this.db
        .select({ total: sql<number>`COALESCE(SUM(${mediaCacheEntries.sizeBytes}), 0)` })
        .from(mediaCacheEntries)
        .where(eq(mediaCacheEntries.mediaKind, "VIDEO"));
      const total = totalRow[0]?.total ?? 0;

      if (total + bytesNeeded <= VIDEO_LIMIT_BYTES) {
        return;
      }

      const oldest = await this.db
        .select()
        .from(mediaCacheEntries)
        .where(eq(mediaCacheEntries.mediaKind, "VIDEO"))
        .orderBy(asc(mediaCacheEntries.lastAccessedAt))
        .limit(1);

      const victim = oldest[0];
      if (!victim) {
        return;
      }
      await this.deleteEntry(victim.remoteUrl, victim.localUri);
    }
  }

  private async findEntry(remoteUrl: string) {
    const rows = await this.db.select().from(mediaCacheEntries).where(eq(mediaCacheEntries.remoteUrl, remoteUrl));
    return rows[0] ?? null;
  }

  private async touch(remoteUrl: string): Promise<void> {
    await this.db
      .update(mediaCacheEntries)
      .set({ lastAccessedAt: this.clock.now().toISOString() })
      .where(eq(mediaCacheEntries.remoteUrl, remoteUrl));
  }

  private async deleteEntry(remoteUrl: string, localUri: string): Promise<void> {
    try {
      new File(localUri).delete();
    } catch {
      // El archivo ya podía no existir (purgado por el SO); no es un error
      // para la limpieza de metadata.
    }
    await this.db.delete(mediaCacheEntries).where(eq(mediaCacheEntries.remoteUrl, remoteUrl));
  }
}

interface MediaCacheEntryRow {
  remoteUrl: string;
  mediaKind: string;
  sourceUpdatedAt: string | null;
  localUri: string;
}

function isInvalidated(entry: MediaCacheEntryRow, resourceUpdatedAt: Date | undefined): boolean {
  if (!resourceUpdatedAt || !entry.sourceUpdatedAt) {
    return false;
  }
  return resourceUpdatedAt.getTime() > new Date(entry.sourceUpdatedAt).getTime();
}

function extensionOf(url: string): string {
  const match = /\.([a-z0-9]+)(?:\?.*)?$/i.exec(url);
  return match ? `.${match[1].toLowerCase()}` : "";
}

function inferKind(url: string): MediaKind {
  const ext = extensionOf(url).replace(".", "");
  if (VIDEO_EXTENSIONS.has(ext)) return "VIDEO";
  if (ANIMATION_EXTENSIONS.has(ext)) return "ANIMATION";
  if (IMAGE_EXTENSIONS.has(ext)) return "IMAGE";
  // Sin clasificar: no evictable por defecto (ADR-008), se guarda como IMAGE
  // (tratamiento más conservador: nunca purgado por `evictLeastRecentlyUsed`,
  // que solo actúa sobre `VIDEO`).
  return "IMAGE";
}

/**
 * Hash determinista y estable (FNV-1a de 32 bits) del `remoteUrl`, usado como
 * nombre de archivo local. ADR-008 describe "SHA-256 truncado"; se usa FNV-1a
 * en su lugar porque no hay ninguna dependencia de criptografía ya aprobada
 * en el stack (`expo-crypto` no está instalado) y aquí el hash no cumple
 * ninguna función de seguridad, solo evitar colisiones de nombre de archivo
 * para el catálogo del MVP (~60 recursos): el riesgo de colisión es
 * despreciable a esa escala. Documentado como desviación menor respecto al
 * ADR en el reporte de la tarea que lo introdujo.
 */
function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
