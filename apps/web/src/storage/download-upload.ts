import type { FileAccess } from "@flow/platform";

/** Fallback for browsers without File System Access: a file input to open and a download link to save. */
export function downloadUpload(doc: Document = document): FileAccess {
  return {
    open() {
      return new Promise((resolve) => {
        const input = doc.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.onchange = async () => {
          const file = input.files?.[0];
          resolve(file ? { name: file.name, text: await file.text() } : undefined);
        };
        input.click();
      });
    },
    async saveAs(suggestedName, text) {
      const a = doc.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      a.download = suggestedName;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  };
}
