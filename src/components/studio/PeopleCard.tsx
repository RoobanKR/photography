"use client";

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Loader2, RotateCcw, ScanFace, Square, Users } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { MediaFile, StudioEvent } from "@/lib/events";
import { DetectedFace, Person, scanPhoto } from "@/lib/faces";
import FaceThumb from "@/components/faces/FaceThumb";
import { btn } from "./Modal";

export interface PeopleCardHandle {
  scan: () => void;
}

interface PeopleCardProps {
  event: StudioEvent;
  canScan: boolean;
  onChange: (people: Person[], scannedIds: string[]) => void;
  onReset: () => void;
}

// Photos sent to the server per request while scanning
const BATCH = 8;

// "People" sidebar card: scans event photos for faces and shows the groups guests will see
const PeopleCard = forwardRef<PeopleCardHandle, PeopleCardProps>(function PeopleCard({ event, canScan, onChange, onReset }, ref) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const stopRef = useRef(false);

  const photos = useMemo(() => event.mediaFiles.filter((m) => m.type === "image"), [event.mediaFiles]);
  const unscanned = photos.filter((m) => !m.facesScanned);
  const people = event.people ?? [];
  const byId = useMemo(() => new Map(photos.map((m) => [m.publicId, m])), [photos]);

  const send = useCallback(
    async (results: { publicId: string; faces: DetectedFace[] }[]) => {
      const data = await api<{ people: Person[]; scanned: string[] }>(`/events/${event._id}/faces`, {
        method: "POST",
        body: { results },
      });
      onChange(data.people, data.scanned);
    },
    [event._id, onChange]
  );

  // Photos waiting to be scanned. Uploads arrive in batches, so new photos can join
  // the queue while a scan is already running.
  const queueRef = useRef<MediaFile[]>([]);
  const runningRef = useRef(false);

  const scan = useCallback(
    async (list: MediaFile[]) => {
      const queued = new Set(queueRef.current.map((m) => m.publicId));
      queueRef.current.push(...list.filter((m) => !queued.has(m.publicId)));
      if (runningRef.current || !queueRef.current.length) return;

      runningRef.current = true;
      stopRef.current = false;
      let done = 0;
      let batch: { publicId: string; faces: DetectedFace[] }[] = [];
      setProgress({ done, total: queueRef.current.length });
      try {
        while (queueRef.current.length && !stopRef.current) {
          const photo = queueRef.current.shift()!;
          let faces: DetectedFace[] = [];
          try {
            faces = await scanPhoto(photo.url);
          } catch {
            // Unreadable photo: record it as scanned with no faces so it isn't retried forever
          }
          batch.push({ publicId: photo.publicId, faces });
          if (batch.length === BATCH || !queueRef.current.length) {
            await send(batch);
            batch = [];
          }
          done += 1;
          setProgress({ done, total: done + queueRef.current.length });
        }
        if (batch.length) await send(batch);
      } catch (err: any) {
        toast.error(err.message || "Face scan failed");
      } finally {
        queueRef.current = [];
        runningRef.current = false;
        setProgress(null);
      }
    },
    [send]
  );

  useImperativeHandle(ref, () => ({ scan: () => scan(event.mediaFiles.filter((m) => m.type === "image" && !m.facesScanned)) }), [scan, event.mediaFiles]);

  const rescanAll = async () => {
    if (progress) return;
    try {
      await api(`/events/${event._id}/faces`, { method: "DELETE" });
      onReset();
      scan(photos);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const percent = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          <Users className="h-3.5 w-3.5" /> People
        </h3>
        <span className="text-xs text-slate-400 dark:text-zinc-500">
          {photos.length - unscanned.length}/{photos.length} scanned
        </span>
      </div>

      {people.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2.5">
          {people.slice(0, 15).map((person) => {
            const photo = byId.get(person.coverPublicId);
            return (
              <div key={person.personId} className="relative" title={`${person.photoCount} photos`}>
                {photo ? (
                  <FaceThumb url={photo.url} box={person.coverBox} className="h-12 w-12 ring-2 ring-white dark:ring-zinc-950" />
                ) : (
                  <span className="block h-12 w-12 rounded-full bg-slate-200 dark:bg-zinc-800" />
                )}
                <span className="absolute -bottom-1 -right-1 rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold leading-4 text-white">
                  {person.photoCount}
                </span>
              </div>
            );
          })}
          {people.length > 15 && (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
              +{people.length - 15}
            </span>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
          {photos.length === 0
            ? "Upload photos to find people."
            : unscanned.length
              ? "Scan photos to group faces. Anyone in 3 or more photos gets their own group in the guest gallery."
              : "No one appears in 3 or more photos yet."}
        </p>
      )}

      {progress ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning {progress.done}/{progress.total}
            </span>
            <button onClick={() => (stopRef.current = true)} className="flex items-center gap-1 hover:text-red-600">
              <Square className="h-3 w-3" /> Stop
            </button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-900">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400 dark:text-zinc-500">Keep this page open until it finishes.</p>
        </div>
      ) : (
        canScan &&
        photos.length > 0 && (
          <div className="mt-4 flex gap-2">
            {unscanned.length > 0 && (
              <button onClick={() => scan(unscanned)} className={`${btn.primary} flex-1 py-1.5`}>
                <ScanFace className="h-4 w-4" /> Scan {unscanned.length} photo{unscanned.length === 1 ? "" : "s"}
              </button>
            )}
            {unscanned.length < photos.length && (
              <button onClick={rescanAll} className={`${btn.secondary} py-1.5 ${unscanned.length ? "" : "flex-1"}`} title="Forget all faces and scan every photo again">
                <RotateCcw className="h-4 w-4" /> {unscanned.length ? "" : "Rescan all"}
              </button>
            )}
          </div>
        )
      )}
    </section>
  );
});

export default PeopleCard;
