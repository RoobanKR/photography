"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, CloudUpload, Film, Image as ImageIcon, Loader2, X, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { uploadWithProgress } from "@/lib/api";
import { MediaFile } from "@/lib/events";
import { formatBytes } from "@/lib/format";
import { expandZips, filesFromDrop, filesFromFolderInput, PickedFile, withMediaType } from "@/lib/download";

const MAX_FILE_BYTES = 100 * 1024 * 1024; // matches the server limit
const BATCH_FILES = 4;
const BATCH_BYTES = 40 * 1024 * 1024;

type ItemStatus = "queued" | "uploading" | "done" | "failed";

interface QueueItem {
  id: string;
  file: File;
  folder: string;
  status: ItemStatus;
  progress: number; // 0..1
  error?: string;
}

export interface MediaUploaderHandle {
  openPicker: () => void;
  openFolderPicker: () => void;
}

// Groups files so one request stays small enough to finish quickly
const toBatches = (items: QueueItem[]) => {
  const batches: QueueItem[][] = [];
  let current: QueueItem[] = [];
  let bytes = 0;
  for (const item of items) {
    if (current.length && (current.length >= BATCH_FILES || bytes + item.file.size > BATCH_BYTES)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(item);
    bytes += item.file.size;
  }
  if (current.length) batches.push(current);
  return batches;
};

// Upload without taking up page space: a hidden picker (opened through the ref),
// drop-anywhere on the page, and a floating progress card.
const MediaUploader = forwardRef<MediaUploaderHandle, { eventId: string; onUploaded: (files: MediaFile[]) => void }>(
  function MediaUploader({ eventId, onUploaded }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [unpacking, setUnpacking] = useState(false);
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [dragging, setDragging] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const busy = queue.some((q) => q.status === "uploading" || q.status === "queued");

    useImperativeHandle(ref, () => ({
      openPicker: () => inputRef.current?.click(),
      openFolderPicker: () => folderInputRef.current?.click(),
    }));

    // Folder inputs need a non-standard attribute React doesn't type
    useEffect(() => {
      folderInputRef.current?.setAttribute("webkitdirectory", "");
    }, []);

    const update = (ids: string[], patch: Partial<QueueItem>) =>
      setQueue((prev) => prev.map((q) => (ids.includes(q.id) ? { ...q, ...patch } : q)));

    const startUpload = async (input: PickedFile[]) => {
      let picked = input;
      if (picked.some((p) => /\.zip$/i.test(p.file.name) || p.file.type.includes("zip"))) {
        setUnpacking(true);
        try {
          picked = await expandZips(picked);
        } catch {
          toast.error("Couldn't open the ZIP file. It may be damaged or password protected.");
          return;
        } finally {
          setUnpacking(false);
        }
      }

      const accepted: QueueItem[] = [];
      const rejected: string[] = [];
      for (const { file: original, folder } of picked) {
        const file = withMediaType(original);
        if (!file) rejected.push(`${original.name} (not a photo or video)`);
        else if (file.size > MAX_FILE_BYTES) rejected.push(`${file.name} (over 100 MB)`);
        else accepted.push({ id: `${folder}/${file.name}-${file.size}-${Math.random()}`, file, folder, status: "queued", progress: 0 });
      }
      if (rejected.length) toast.warn(`Skipped ${rejected.length} file(s): ${rejected.slice(0, 3).join(", ")}${rejected.length > 3 ? "…" : ""}`);
      if (!accepted.length) return;

      setCollapsed(false);
      setQueue((prev) => [...prev.filter((q) => q.status !== "done"), ...accepted]);

      let uploadedCount = 0;
      for (const batch of toBatches(accepted)) {
        const ids = batch.map((b) => b.id);
        update(ids, { status: "uploading" });

        const form = new FormData();
        form.append("folderPaths", JSON.stringify(batch.map((b) => b.folder)));
        batch.forEach((b) => form.append("files", b.file));

        try {
          const result = await uploadWithProgress<{ uploadedFiles: MediaFile[]; failedFiles: string[] }>(
            `/events/${eventId}/upload-media`,
            form,
            (fraction) => update(ids, { progress: fraction })
          );
          const failed = new Set(result.failedFiles ?? []);
          setQueue((prev) =>
            prev.map((q) =>
              ids.includes(q.id)
                ? failed.has(q.file.name)
                  ? { ...q, status: "failed", error: "Storage upload failed" }
                  : { ...q, status: "done", progress: 1 }
                : q
            )
          );
          uploadedCount += result.uploadedFiles.length;
          onUploaded(result.uploadedFiles);
        } catch (err: any) {
          // Storage limit reached: nothing else will fit, so stop and explain once
          if (err.status === 413) {
            const remaining = accepted.filter((a) => !ids.includes(a.id)).map((a) => a.id);
            update([...ids, ...remaining], { status: "failed", error: "Storage limit reached" });
            toast.error(err.message, { autoClose: 8000 });
            break;
          }
          update(ids, { status: "failed", error: err.message });
        }
      }

      if (uploadedCount) toast.success(`Uploaded ${uploadedCount} file(s)`);
    };

    // Drop files anywhere on the page
    useEffect(() => {
      let depth = 0;
      const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
      const onEnter = (e: DragEvent) => {
        if (!hasFiles(e)) return;
        depth++;
        setDragging(true);
      };
      const onLeave = (e: DragEvent) => {
        if (!hasFiles(e)) return;
        depth = Math.max(depth - 1, 0);
        if (depth === 0) setDragging(false);
      };
      const onOver = (e: DragEvent) => hasFiles(e) && e.preventDefault();
      const onDrop = (e: DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth = 0;
        setDragging(false);
        if (e.dataTransfer?.files.length) filesFromDrop(e.dataTransfer).then(startUpload);
      };
      window.addEventListener("dragenter", onEnter);
      window.addEventListener("dragleave", onLeave);
      window.addEventListener("dragover", onOver);
      window.addEventListener("drop", onDrop);
      return () => {
        window.removeEventListener("dragenter", onEnter);
        window.removeEventListener("dragleave", onLeave);
        window.removeEventListener("dragover", onOver);
        window.removeEventListener("drop", onDrop);
      };
      // startUpload only depends on eventId and onUploaded
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId, onUploaded]);

    const totalBytes = queue.reduce((sum, q) => sum + q.file.size, 0);
    const sentBytes = queue.reduce((sum, q) => sum + q.file.size * (q.status === "done" ? 1 : q.progress), 0);
    const doneCount = queue.filter((q) => q.status === "done").length;
    const failedCount = queue.filter((q) => q.status === "failed").length;
    const percent = totalBytes ? Math.round((sentBytes / totalBytes) * 100) : 0;

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,.zip,application/zip"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) startUpload(Array.from(e.target.files).map((file) => ({ file, folder: "" })));
            e.target.value = "";
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) startUpload(filesFromFolderInput(Array.from(e.target.files)));
            e.target.value = "";
          }}
        />

        {unpacking && (
          <div className="fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Opening ZIP…
          </div>
        )}

        {dragging && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-blue-600/15 p-6 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-blue-500 bg-white/95 px-12 py-10 text-center shadow-2xl dark:bg-zinc-950/95">
              <span className="rounded-full bg-blue-600 p-4 text-white"><CloudUpload className="h-8 w-8" /></span>
              <p className="mt-4 text-lg font-semibold">Drop to upload</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Photos, videos, folders or ZIP files · up to 100 MB per file</p>
            </div>
          </div>
        )}

        {queue.length > 0 && (
          <div className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className={`rounded-full p-1.5 ${busy ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50" : failedCount ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50"}`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : failedCount ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {busy ? `Uploading ${doneCount} of ${queue.length}` : `Uploaded ${doneCount} of ${queue.length}`}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {formatBytes(sentBytes)} of {formatBytes(totalBytes)}
                  {failedCount > 0 && <span className="text-red-500"> · {failedCount} failed</span>}
                </p>
              </div>
              <button onClick={() => setCollapsed(!collapsed)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800" aria-label={collapsed ? "Show files" : "Hide files"}>
                {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {!busy && (
                <button onClick={() => setQueue([])} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="h-1 bg-slate-100 dark:bg-zinc-900">
              <div className="h-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
            </div>
            {!collapsed && (
              <ul className="max-h-52 divide-y divide-slate-100 overflow-y-auto dark:divide-zinc-900">
                {queue.map((item) => {
                  const Icon = item.file.type.startsWith("video/") ? Film : ImageIcon;
                  return (
                    <li key={item.id} className="flex items-center gap-2.5 px-4 py-2 text-xs">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1 truncate">
                        {item.folder && <span className="text-slate-400">{item.folder}/</span>}
                        {item.file.name}
                      </span>
                      <span className="w-16 shrink-0 text-right">
                        {item.status === "done" && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />}
                        {item.status === "failed" && <span title={item.error} className="text-red-500">Failed</span>}
                        {item.status === "queued" && <span className="text-slate-400">Waiting</span>}
                        {item.status === "uploading" && (
                          // Bytes are sent; the server is still saving to Cloudinary
                          <span className="text-blue-600 dark:text-blue-400">{item.progress >= 1 ? "Saving…" : `${Math.round(item.progress * 100)}%`}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </>
    );
  }
);

export default MediaUploader;
