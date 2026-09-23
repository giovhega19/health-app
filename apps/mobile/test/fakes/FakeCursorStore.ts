import type { CursorStore } from "@/features/sync";

/** Fake en memoria de `CursorStore` (`features/sync/application/ports.ts`). */
export class FakeCursorStore implements CursorStore {
  private cursor: string | null;

  constructor(initial: string | null = null) {
    this.cursor = initial;
  }

  async load(): Promise<string | null> {
    return this.cursor;
  }

  async save(cursor: string | null): Promise<void> {
    this.cursor = cursor;
  }
}
