"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, Trash2, X } from "lucide-react";
import { cloudinaryUrl, MediaFile } from "@/lib/events";
import { formatBytes, formatDate } from "@/lib/format";

interface MediaViewerProps {
  media: MediaFile[];
  index: number | null; // null = closed
  onIndexChange: (index: number | null) => void;
  onDelete?: (media: MediaFile) => void;
}

export const downloadUrl = (media: MediaFile) => cloudinaryUrl(media.url, "fl_attachment");

export default function MediaViewer({ media, index, onIndexChange, onDelete }: MediaViewerProps) {
  const current = index !== null ? media[index] : null;

  const go = useCallback(
    (step: number) => {
      if (index === null || media.length === 0) return;
      onIndexChange((index + step + media.length) % media.length);
    },
    [index, media.length, onIndexChange]
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndexChange(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, onIndexChange]);

  // The list can shrink (e.g. after a delete) while the viewer is open
  useEffect(() => {
    if (index !== null && index >= media.length) onIndexChange(media.length ? media.length - 1 : null);
  }, [index, media.length, onIndexChange]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{current.originalName}</p>
          <p className="text-xs text-white/50">
            {index! + 1} of {media.length} · {formatBytes(current.size)} · {formatDate(current.uploadedAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <a href={downloadUrl(current)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Download" title="Download">
            <Download className="h-5 w-5" />
          </a>
          {onDelete && (
            <button onClick={() => onDelete(current)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Delete" title="Delete">
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button onClick={() => onIndexChange(null)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close" title="Close (Esc)">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16">
        {current.type === "video" ? (
          <video key={current.publicId} src={current.url} controls autoPlay playsInline className="max-h-full max-w-full rounded-lg" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.publicId}
            src={cloudinaryUrl(current.url, "c_limit,w_2400,h_2400,q_auto,f_auto")}
            alt={current.originalName}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}

        {media.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 hover:bg-white/20 sm:left-4"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 hover:bg-white/20 sm:right-4"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
