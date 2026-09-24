import { ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import type { FileGateway, PickedFile } from "@/features/routines/application/ports";
import type { FileError } from "@/features/routines/domain/errors";

/**
 * Fake en memoria de `FileGateway` (`features/routines/application/ports.ts`,
 * CA-03.08.1/.2, `specs/F03-editor-rutinas/plan.md` §3).
 */
export class FakeFileGateway implements FileGateway {
  readonly sharedFiles: { filename: string; content: string }[] = [];
  nextPickedFile: PickedFile | null = null;
  nextPickError: FileError | null = null;
  nextShareError: FileError | null = null;

  async pickFile(): Promise<Result<PickedFile | null, FileError>> {
    if (this.nextPickError) {
      return { ok: false, error: this.nextPickError };
    }
    return ok(this.nextPickedFile);
  }

  async shareFile(filename: string, content: string): Promise<Result<void, FileError>> {
    if (this.nextShareError) {
      return { ok: false, error: this.nextShareError };
    }
    this.sharedFiles.push({ filename, content });
    return ok(undefined);
  }
}
