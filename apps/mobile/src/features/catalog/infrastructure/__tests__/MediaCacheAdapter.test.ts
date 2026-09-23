/**
 * `MediaCacheAdapter` (ADR-008, tarea `F02-T12`). CA-02.05.1 (sin conexión)
 * depende de que, una vez descargado un medio, quede disponible localmente
 * sin red; la política LRU (300 MB, solo `VIDEO`) se prueba aquí con
 * property-based testing (`fast-check`, `specs/F02-catalogo-propuesta/plan.md`
 * §5 "duración monótona"-style invariante: el total de bytes de video nunca
 * supera el límite tras `ensureCached`/`evictLeastRecentlyUsed`).
 *
 * `expo-file-system` se reemplaza por `test/helpers/expoFileSystemFake.ts`
 * (el módulo nativo real no tiene binding en Jest, ver comentario de ese
 * archivo); Drizzle/SQLite es real (`test/helpers/createTestDb.ts`).
 */
import fc from "fast-check";
import { MediaCacheAdapter } from "../MediaCacheAdapter";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";
import { isErr, isOk } from "@/shared/domain/Result";
import {
  fakeDisk,
  failingUrls,
  resetFakeFileSystem,
  sizesByUrl,
} from "@test/helpers/expoFileSystemFake";

jest.mock("expo-file-system", () => jest.requireActual("@test/helpers/expoFileSystemFake"));

describe("RF-02.05 MediaCacheAdapter (ADR-008)", () => {
  beforeEach(() => {
    resetFakeFileSystem();
  });

  it("CA-02.05.1 descarga un medio nuevo y lo deja disponible localmente", async () => {
    const db = await createTestDb();
    const adapter = new MediaCacheAdapter(db, new FakeClock("2026-09-22T10:00:00Z"));

    const result = await adapter.ensureCached({ remoteUrl: "https://cdn.fitapp.test/anim/flexion.gif" });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(fakeDisk.has(result.value)).toBe(true);
  });

  it("CA-02.05.1 en modo avión (segunda llamada), reutiliza el archivo ya cacheado sin volver a descargar", async () => {
    const db = await createTestDb();
    const adapter = new MediaCacheAdapter(db, new FakeClock("2026-09-22T10:00:00Z"));
    const remoteUrl = "https://cdn.fitapp.test/anim/flexion.gif";

    const first = await adapter.ensureCached({ remoteUrl });
    if (!isOk(first)) throw new Error("setup");

    failingUrls.add(remoteUrl); // simula "sin red": si intentara descargar, fallaría
    const second = await adapter.ensureCached({ remoteUrl });

    expect(isOk(second)).toBe(true);
    if (isOk(second)) {
      expect(second.value).toBe(first.value);
    }
  });

  it("propaga NETWORK_UNAVAILABLE si el medio no estaba cacheado y la descarga falla", async () => {
    const db = await createTestDb();
    const adapter = new MediaCacheAdapter(db, new FakeClock("2026-09-22T10:00:00Z"));
    const remoteUrl = "https://cdn.fitapp.test/video/no-disponible.mp4";
    failingUrls.add(remoteUrl);

    const result = await adapter.ensureCached({ remoteUrl });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toEqual({ kind: "NETWORK_UNAVAILABLE" });
    }
  });

  it("nunca purga imágenes/animaciones, solo video (ADR-008)", async () => {
    const db = await createTestDb();
    const adapter = new MediaCacheAdapter(db, new FakeClock("2026-09-22T10:00:00Z"));

    const imageUrl = "https://cdn.fitapp.test/img/muy-grande.png";
    sizesByUrl.set(imageUrl, 400 * 1024 * 1024); // 400 MB, mayor que el límite de video
    const result = await adapter.ensureCached({ remoteUrl: imageUrl, kind: "IMAGE" });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(fakeDisk.has(result.value)).toBe(true);
    }
  });

  it("la política LRU nunca deja el total de video por encima de 300 MB (propiedad)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1024, max: 150 * 1024 * 1024 }), { minLength: 1, maxLength: 6 }),
        async (sizes) => {
          resetFakeFileSystem();
          const db = await createTestDb();
          const adapter = new MediaCacheAdapter(db, new FakeClock("2026-09-22T10:00:00Z"));

          for (const [index, size] of sizes.entries()) {
            const url = `https://cdn.fitapp.test/video/${String(index)}.mp4`;
            sizesByUrl.set(url, size);
            await adapter.ensureCached({ remoteUrl: url, kind: "VIDEO" });
          }

          const total = [...fakeDisk.values()].reduce((sum, entry) => sum + entry.size, 0);
          expect(total).toBeLessThanOrEqual(300 * 1024 * 1024);
        },
      ),
      { numRuns: 15 },
    );
  });
});
