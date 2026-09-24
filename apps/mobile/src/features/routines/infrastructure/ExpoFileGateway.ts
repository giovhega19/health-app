import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { Directory, File, Paths } from "expo-file-system";
import { err, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { FileError } from "../domain/errors";
import type { FileGateway, PickedFile } from "../application/ports";

/**
 * `ExpoFileGateway` (CA-03.08.1/CA-03.08.2, tarea `F03-T11`): adaptador real
 * del puerto `FileGateway` sobre `expo-document-picker` (importar) +
 * `expo-file-system` + `expo-sharing` (exportar, abre la hoja nativa de
 * compartir).
 */
export class ExpoFileGateway implements FileGateway {
  private readonly exportDirectory = new Directory(Paths.cache, "routine-export");

  async pickFile(): Promise<Result<PickedFile | null, FileError>> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "*/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || result.assets.length === 0) {
        return ok(null);
      }
      const asset = result.assets[0]!;
      const file = new File(asset.uri);
      const content = await file.text();
      const sizeBytes = asset.size ?? file.size ?? content.length;
      return ok({ content, sizeBytes });
    } catch (error) {
      return err({ kind: "READ_ERROR", message: messageOf(error) });
    }
  }

  async shareFile(filename: string, content: string): Promise<Result<void, FileError>> {
    try {
      if (!this.exportDirectory.exists) {
        this.exportDirectory.create({ intermediates: true });
      }
      const file = new File(this.exportDirectory, filename);
      if (file.exists) {
        file.delete();
      }
      file.create();
      file.write(content);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri);
      }
      return ok(undefined);
    } catch (error) {
      return err({ kind: "WRITE_ERROR", message: messageOf(error) });
    }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
