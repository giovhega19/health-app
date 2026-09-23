/**
 * RF-02.05 `EnsureOfflineMedia`
 * (`features/catalog/application/EnsureOfflineMedia.ts`, tarea `F02-T09`/
 * relacionada con `F02-T12`, todavía no implementada: esta prueba falla
 * ahora mismo con "Cannot find module '../EnsureOfflineMedia'", el estado
 * rojo esperado).
 *
 * CA-02.05.1 "Sin conexión": dado que el catálogo y los medios de mis
 * rutinas ya se descargaron y estoy en modo avión, puedo ver todos los
 * ejercicios de mis rutinas con su animación. Se prueba a nivel de
 * aplicación con `FakeMediaCachePort` (sin sistema de archivos real ni red
 * real, 07-estrategia-pruebas.md §2.3). La política LRU real (300 MB, ver
 * ADR-008) vive en `infrastructure/MediaCacheAdapter.ts`, bloqueada por
 * `F02-T02` (ADR-008 todavía no redactado, `plan.md` §7): sus pruebas de
 * integración se añaden cuando ese ADR exista y `F02-T12` deje de estar
 * bloqueada. Lo que sí se puede y debe probar ya es el comportamiento
 * observable exigido por el criterio: si el medio ya está en caché, se
 * resuelve sin depender de la red.
 */
import { EnsureOfflineMedia } from "../EnsureOfflineMedia";
import { isErr, isOk } from "@/shared/domain/Result";
import { FakeMediaCachePort } from "@test/fakes/FakeMediaCachePort";

const PUSH_UP_ANIMATION = "https://cdn.fitapp.test/anim/flexion-de-pecho.gif";
const LUNGE_ANIMATION = "https://cdn.fitapp.test/anim/zancadas.gif";
const NOT_YET_DOWNLOADED = "https://cdn.fitapp.test/anim/nueva-rutina-sin-descargar.gif";

describe("RF-02.05 EnsureOfflineMedia", () => {
  it("CA-02.05.1 en modo avión, con medios ya descargados, resuelve las URIs locales sin llamar a la red", async () => {
    const mediaCache = new FakeMediaCachePort({
      [PUSH_UP_ANIMATION]: "file:///local/anim/flexion-de-pecho.gif",
      [LUNGE_ANIMATION]: "file:///local/anim/zancadas.gif",
    });
    const useCase = new EnsureOfflineMedia(mediaCache);

    const result = await useCase.execute([
      { remoteUrl: PUSH_UP_ANIMATION },
      { remoteUrl: LUNGE_ANIMATION },
    ]);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toEqual([
      "file:///local/anim/flexion-de-pecho.gif",
      "file:///local/anim/zancadas.gif",
    ]);
    // Ningún medio requirió red: todos ya estaban descargados (modo avión).
    expect(mediaCache.networkFetchCount).toBe(0);
  });

  it("CA-02.05.1 un medio que nunca se descargó (todavía no visto con conexión) no revienta la app: devuelve un error controlado", async () => {
    const mediaCache = new FakeMediaCachePort({
      [PUSH_UP_ANIMATION]: "file:///local/anim/flexion-de-pecho.gif",
    });
    const useCase = new EnsureOfflineMedia(mediaCache);

    const result = await useCase.execute([{ remoteUrl: NOT_YET_DOWNLOADED }]);

    expect(isErr(result)).toBe(true);
  });
});
