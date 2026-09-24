/**
 * `ExpoFileGateway` (CA-03.08.1/CA-03.08.2, tarea `F03-T11`). Los módulos
 * nativos (`expo-document-picker`, `expo-sharing`, `expo-file-system`) no
 * tienen binding en Jest: se reemplazan por fakes en memoria, mismo patrón
 * que `MediaCacheAdapter.test.ts`/`SecureStoreAdapter.test.ts`.
 */
import { isOk } from "@/shared/domain/Result";
import { resetFakeFileSystem, fakeDisk, File as FakeFile } from "@test/helpers/expoFileSystemFake";

let mockPickerResult: { canceled: boolean; assets: { uri: string; size?: number; name: string }[] } = {
  canceled: true,
  assets: [],
};
let mockShareAvailable = true;
const mockSharedUris: string[] = [];

jest.mock("expo-file-system", () => jest.requireActual("@test/helpers/expoFileSystemFake"));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(async () => mockPickerResult),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => mockShareAvailable),
  shareAsync: jest.fn(async (uri: string) => {
    mockSharedUris.push(uri);
  }),
}));

// eslint-disable-next-line import/first -- debe importarse después de los jest.mock (hoisted igualmente, orden solo por claridad).
import { ExpoFileGateway } from "../ExpoFileGateway";

describe("ExpoFileGateway", () => {
  beforeEach(() => {
    resetFakeFileSystem();
    mockPickerResult = { canceled: true, assets: [] };
    mockShareAvailable = true;
    mockSharedUris.length = 0;
  });

  it("pickFile() devuelve null cuando el usuario cancela", async () => {
    const gateway = new ExpoFileGateway();

    const result = await gateway.pickFile();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBeNull();
    }
  });

  it("pickFile() lee el contenido del archivo elegido", async () => {
    const pickedUri = new FakeFile("file:///picked.json").uri;
    fakeDisk.set(pickedUri, { size: 5, content: '{"a":1}' });
    mockPickerResult = { canceled: false, assets: [{ uri: pickedUri, size: 7, name: "picked.json" }] };
    const gateway = new ExpoFileGateway();

    const result = await gateway.pickFile();

    expect(isOk(result)).toBe(true);
    if (!isOk(result) || !result.value) return;
    expect(result.value.content).toBe('{"a":1}');
    expect(result.value.sizeBytes).toBe(7);
  });

  it("shareFile() escribe el archivo y abre la hoja nativa de compartir", async () => {
    const gateway = new ExpoFileGateway();

    const result = await gateway.shareFile("pierna-casa.fitroutine.json", '{"schema":"fitapp.routine"}');

    expect(isOk(result)).toBe(true);
    expect(mockSharedUris).toHaveLength(1);
  });

  it("shareFile() no intenta compartir si la hoja nativa no está disponible", async () => {
    mockShareAvailable = false;
    const gateway = new ExpoFileGateway();

    const result = await gateway.shareFile("pierna-casa.fitroutine.json", "{}");

    expect(isOk(result)).toBe(true);
    expect(mockSharedUris).toHaveLength(0);
  });
});
