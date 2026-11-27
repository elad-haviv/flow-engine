import type { FileAccess } from "@flow/platform";

interface FileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(d: string): Promise<void>; close(): Promise<void> }>;
  name: string;
}
interface FsaWindow {
  showOpenFilePicker?: (o?: object) => Promise<FileHandle[]>;
  showSaveFilePicker?: (o?: object) => Promise<FileHandle>;
}

const TYPES = [{ description: "Flow Engine project", accept: { "application/json": [".flow.json", ".json"] } }];

export const hasFileSystemAccess = (w: object = window): boolean => {
  const f = w as FsaWindow;
  return typeof f.showOpenFilePicker === "function" && typeof f.showSaveFilePicker === "function";
};

/** Open and save through the File System Access API (Chromium). */
export function fileSystemAccess(w: object = window): FileAccess {
  const f = w as FsaWindow;
  return {
    async open() {
      const [h] = await f.showOpenFilePicker!({ types: TYPES });
      if (!h) return undefined;
      return { name: h.name, text: await (await h.getFile()).text() };
    },
    async saveAs(suggestedName, text) {
      const h = await f.showSaveFilePicker!({ suggestedName, types: TYPES });
      const wr = await h.createWritable();
      await wr.write(text);
      await wr.close();
    },
  };
}
