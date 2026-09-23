/**
 * Fake en memoria de `expo-file-system` (API `File`/`Directory`/`Paths` de
 * Expo SDK 57), usado por `MediaCacheAdapter.test.ts`. Instrucción del
 * encargo: "fakes de ... expo-file-system si no son testeables directo en
 * Jest (son válidos ahí, a diferencia de dominio/aplicación)" — el módulo
 * nativo real (`ExpoFileSystem.FileSystemFile`, basado en JSI) no tiene
 * binding en Node/Jest.
 */
interface StoredFile {
  size: number;
}

export const fakeDisk = new Map<string, StoredFile>();
/** URLs que deben fallar la descarga (simula "sin red"/`NETWORK_UNAVAILABLE`). */
export const failingUrls = new Set<string>();
/** Tamaño (bytes) que "descarga" cada URL; por defecto 1024. */
export const sizesByUrl = new Map<string, number>();

export function resetFakeFileSystem(): void {
  fakeDisk.clear();
  failingUrls.clear();
  sizesByUrl.clear();
}

function joinUri(parts: (string | { uri: string })[]): string {
  return parts
    .map((part) => (typeof part === "string" ? part : part.uri))
    .join("/")
    .replace(/\/{2,}/g, "/");
}

export class Directory {
  uri: string;

  constructor(...parts: (string | Directory)[]) {
    this.uri = joinUri(parts as (string | { uri: string })[]);
  }

  get exists(): boolean {
    return true;
  }

  create(): void {
    // no-op: el directorio "siempre existe" en el fake.
  }
}

export class File {
  uri: string;

  constructor(...parts: (string | File | Directory)[]) {
    this.uri = joinUri(parts as (string | { uri: string })[]);
  }

  get exists(): boolean {
    return fakeDisk.has(this.uri);
  }

  get size(): number {
    return fakeDisk.get(this.uri)?.size ?? 0;
  }

  delete(): void {
    fakeDisk.delete(this.uri);
  }

  static downloadFileAsync = jest.fn(async (url: string, destination: File | Directory): Promise<File> => {
    if (failingUrls.has(url)) {
      throw new Error(`network unavailable for ${url}`);
    }
    const size = sizesByUrl.get(url) ?? 1024;
    const target = destination instanceof File ? destination : new File(destination, "download");
    fakeDisk.set(target.uri, { size });
    return new File(target.uri);
  });
}

export class Paths {
  static get cache(): Directory {
    return new Directory("file:///cache");
  }
}
