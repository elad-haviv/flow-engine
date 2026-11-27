import type { FileAccess } from "@flow/platform";
import { downloadUpload } from "./download-upload";
import { fileSystemAccess, hasFileSystemAccess } from "./file-system-access";

export { indexedDbStorage } from "./indexeddb";
export const fileAccess = (): FileAccess => (hasFileSystemAccess() ? fileSystemAccess() : downloadUpload());
export const fileAccessKind = (): "fsa" | "download" => (hasFileSystemAccess() ? "fsa" : "download");
