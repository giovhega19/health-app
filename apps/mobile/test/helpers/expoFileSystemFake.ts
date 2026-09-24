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
  /** Contenido de texto (F03, `ExpoFileGateway`): ausente para los archivos
   * "descargados" por `downloadFileAsync` (medios binarios, F02). */
  content?: string;
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

  /** F03 (`ExpoFileGateway`): crea una entrada vacía si no existe. */
  create(): void {
    if (!fakeDisk.has(this.uri)) {
      fakeDisk.set(this.uri, { size: 0, content: "" });
    }
  }

  /** F03 (`ExpoFileGateway`): escribe contenido de texto (sobreescribe). */
  write(content: string): void {
    fakeDisk.set(this.uri, { size: content.length, content });
  }

  /** F03 (`ExpoFileGateway`): lee el contenido de texto guardado con `write()`. */
  async text(): Promise<string> {
    const stored = fakeDisk.get(this.uri);
    if (!stored) {
      throw new Error(`file not found: ${this.uri}`);
    }
    return stored.content ?? "";
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
