// Downloading several photos/videos at once as one ZIP, built in the browser

import { cloudinaryUrl } from "./events";

export interface DownloadItem {
  url: string;
  originalName: string;
  folderPath?: string;
}

const PARALLEL = 4;

// Cloudinary adds fl_attachment so the browser saves the file instead of opening it
export const attachmentUrl = (url: string) => cloudinaryUrl(url, "fl_attachment");

const saveBlob = (blob: Blob, fileName: string) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
};

const safeName = (name: string) => name.replace(/[\\/:*?"<>|]+/g, "_").trim() || "file";

// "photo.jpg" twice in one folder becomes "photo.jpg" and "photo (2).jpg"
const uniquePath = (path: string, used: Set<string>) => {
  if (!used.has(path)) {
    used.add(path);
    return path;
  }
  const dot = path.lastIndexOf(".");
  const base = dot > 0 ? path.slice(0, dot) : path;
  const ext = dot > 0 ? path.slice(dot) : "";
  for (let n = 2; ; n++) {
    const next = `${base} (${n})${ext}`;
    if (!used.has(next)) {
      used.add(next);
      return next;
    }
  }
};

/**
 * Downloads one file directly, or several as "<zipName>.zip" keeping their folders.
 * onProgress(done, total) runs as files are fetched.
 */
export async function downloadMedia(
  items: DownloadItem[],
  zipName: string,
  onProgress?: (done: number, total: number) => void
) {
  if (!items.length) return;

  if (items.length === 1) {
    window.location.href = attachmentUrl(items[0].url);
    return;
  }

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Set<string>();
  let done = 0;
  let failed = 0;
  onProgress?.(0, items.length);

  const queue = [...items];
  const worker = async () => {
    while (queue.length) {
      const item = queue.shift()!;
      try {
        const res = await fetch(item.url);
        if (!res.ok) throw new Error(String(res.status));
        const folder = (item.folderPath ?? "").split("/").map(safeName).filter(Boolean).join("/");
        const path = uniquePath(`${folder ? `${folder}/` : ""}${safeName(item.originalName)}`, used);
        // Photos and videos are already compressed; storing them is much faster
        zip.file(path, await res.blob(), { compression: "STORE" });
      } catch {
        failed++;
      }
      done++;
      onProgress?.(done, items.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL, items.length) }, worker));

  if (failed === items.length) throw new Error("Could not download the files. Check your connection and try again.");
  const blob = await zip.generateAsync({ type: "blob" });
  saveBlob(blob, `${safeName(zipName)}.zip`);
  return { failed };
}

// ---------- Reading folders and ZIP files picked for upload ----------

export interface PickedFile {
  file: File;
  folder: string; // "" for loose files
}

const MEDIA_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  webm: "video/webm",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  "3gp": "video/3gpp",
};

const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
const dirname = (path: string) => path.split("/").slice(0, -1).join("/");
const basename = (path: string) => path.split("/").pop() ?? path;
const isHidden = (path: string) => path.split("/").some((part) => part.startsWith(".") || part === "__MACOSX");

// Some folders give files without a type (e.g. HEIC on Windows); fill it in from the extension
export const withMediaType = (file: File): File | null => {
  if (file.type.startsWith("image/") || file.type.startsWith("video/")) return file;
  const type = MEDIA_TYPES[extensionOf(file.name)];
  return type ? new File([file], file.name, { type, lastModified: file.lastModified }) : null;
};

export const isZip = (file: File) => file.type === "application/zip" || file.type === "application/x-zip-compressed" || extensionOf(file.name) === "zip";

// Unpacks the photos and videos inside a ZIP. Files at the top of the ZIP go into a
// folder named after it; folders inside the ZIP are kept.
export async function filesFromZip(zipFile: File, parentFolder = ""): Promise<PickedFile[]> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(zipFile);
  const zipFolder = zipFile.name.replace(/\.zip$/i, "");
  const out: PickedFile[] = [];

  for (const entry of Object.values(zip.files)) {
    if (entry.dir || isHidden(entry.name)) continue;
    const type = MEDIA_TYPES[extensionOf(entry.name)];
    if (!type) continue;
    const blob = await entry.async("blob");
    const inner = dirname(entry.name);
    const folder = [parentFolder, inner || zipFolder].filter(Boolean).join("/");
    out.push({ file: new File([blob], basename(entry.name), { type }), folder });
  }
  return out;
}

// Files from <input webkitdirectory>: keeps "Wedding/Haldi" from each file's relative path
export const filesFromFolderInput = (files: File[]): PickedFile[] =>
  files
    .filter((f) => !isHidden((f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name))
    .map((file) => ({ file, folder: dirname((file as File & { webkitRelativePath?: string }).webkitRelativePath || "") }));

// Dropped items can include whole folders; walk them recursively
export async function filesFromDrop(dataTransfer: DataTransfer): Promise<PickedFile[]> {
  const entries = Array.from(dataTransfer.items)
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => Boolean(e));

  if (!entries.length) return Array.from(dataTransfer.files).map((file) => ({ file, folder: "" }));

  const out: PickedFile[] = [];
  const readFile = (entry: FileSystemFileEntry) => new Promise<File>((resolve, reject) => entry.file(resolve, reject));
  const readAll = async (dir: FileSystemDirectoryEntry) => {
    const reader = dir.createReader();
    const all: FileSystemEntry[] = [];
    // readEntries returns at most ~100 entries per call
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
      if (!batch.length) break;
      all.push(...batch);
    }
    return all;
  };
  const walk = async (entry: FileSystemEntry, folder: string) => {
    if (entry.name.startsWith(".") || entry.name === "__MACOSX") return;
    if (entry.isFile) out.push({ file: await readFile(entry as FileSystemFileEntry), folder });
    else if (entry.isDirectory) {
      const sub = folder ? `${folder}/${entry.name}` : entry.name;
      for (const child of await readAll(entry as FileSystemDirectoryEntry)) await walk(child, sub);
    }
  };
  for (const entry of entries) await walk(entry, "");
  return out;
}

// Expands any ZIPs among picked files into the photos/videos inside them
export async function expandZips(picked: PickedFile[]): Promise<PickedFile[]> {
  const out: PickedFile[] = [];
  for (const p of picked) {
    if (isZip(p.file)) out.push(...(await filesFromZip(p.file, p.folder)));
    else out.push(p);
  }
  return out;
}

// Albums from folder paths, with how many files each holds
export const albumsOf = <T extends { folderPath?: string }>(media: T[]) => {
  const counts = new Map<string, number>();
  for (const m of media) if (m.folderPath) counts.set(m.folderPath, (counts.get(m.folderPath) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([path, count]) => ({ path, count }));
};

export const albumLabel = (path: string) => path.split("/").join(" › ");
