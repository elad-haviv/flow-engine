import { describe, expect, it } from "vitest";
import { fileSystemAccess, hasFileSystemAccess } from "../src/storage/file-system-access";

describe("file system access adapter", () => {
  const fake = (store: { text: string }) => ({
    showSaveFilePicker: async () => ({
      name: "x",
      getFile: async () => new File([store.text], "x"),
      createWritable: async () => ({
        write: async (d: string) => {
          store.text = d;
        },
        close: async () => {},
      }),
    }),
    showOpenFilePicker: async () => [
      {
        name: "x",
        getFile: async () => new File([store.text], "x"),
        createWritable: async () => ({ write: async () => {}, close: async () => {} }),
      },
    ],
  });
  it("detects availability", () => {
    expect(hasFileSystemAccess({})).toBe(false);
    expect(hasFileSystemAccess(fake({ text: "" }))).toBe(true);
  });
  it("saves and opens through the handle", async () => {
    const store = { text: "" };
    const fa = fileSystemAccess(fake(store));
    await fa.saveAs("x", "hello");
    expect(await fa.open()).toEqual({ name: "x", text: "hello" });
  });
});
