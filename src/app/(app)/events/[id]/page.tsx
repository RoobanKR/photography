"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  Clock,
  CloudUpload,
  Download,
  Folder,
  FolderUp,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Play,
  Square,
  Star,
  Trash2,
  User,
  Video,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import {
  cloudinaryUrl,
  coverImage,
  EVENT_GRADIENTS,
  EVENT_TYPES,
  eventPhase,
  formatEventDate,
  formatTime,
  MediaFile,
  mediaSummary,
  PHASE_DOTS,
  PHASE_STYLES,
  StudioEvent,
  thumbUrl,
} from "@/lib/events";
import { formatBytes } from "@/lib/format";
import ConfirmDialog from "@/components/studio/ConfirmDialog";
import EventFormDialog from "@/components/studio/EventFormDialog";
import MediaUploader, { MediaUploaderHandle } from "@/components/studio/MediaUploader";
import MediaViewer, { downloadUrl } from "@/components/studio/MediaViewer";
import { btn } from "@/components/studio/Modal";
import QrCard from "@/components/studio/QrCard";
import PeopleCard, { PeopleCardHandle } from "@/components/studio/PeopleCard";
import type { Person } from "@/lib/faces";
import { albumLabel, albumsOf, downloadMedia } from "@/lib/download";
import RequirePermission from "@/components/studio/RequirePermission";
import { useAuth } from "@/lib/auth";

type MediaTab = "all" | "image" | "video";

type PendingDelete =
  | { kind: "event" }
  | { kind: "media"; items: MediaFile[] };

// Glass buttons sit on top of the cover photo
const heroBtn =
  "inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/25";

const whatsappLink = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
};

function Stat({ icon: Icon, label, value, hint, tone }: { icon: React.ElementType; label: string; value: string | number; hint?: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={`rounded-lg p-2 ${tone}`}><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">{label}</p>
        <p className="truncate text-sm font-semibold">
          {value}
          {hint && <span className="ml-1 font-normal text-slate-400">{hint}</span>}
        </p>
      </div>
    </div>
  );
}

export default function EventDetailPageWithAccess() {
  return (
    <RequirePermission permission="events.view">
      <EventDetailPage />
    </RequirePermission>
  );
}

function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const canEdit = can("events.edit");
  const canDeleteEvent = can("events.delete");
  const canUpload = can("media.upload");
  const canDeleteMedia = can("media.delete");

  const uploaderRef = useRef<MediaUploaderHandle>(null);
  const peopleRef = useRef<PeopleCardHandle>(null);
  const [autoScanTick, setAutoScanTick] = useState(0);
  const [event, setEvent] = useState<StudioEvent | null>(null);
  const [guestUrl, setGuestUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<MediaTab>("all");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api<{ event: StudioEvent; guestUrl: string }>(`/events/${id}`)
      .then((data) => {
        setEvent(data.event);
        setGuestUrl(data.guestUrl);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Newest uploads first
  const allMedia = useMemo(
    () =>
      [...(event?.mediaFiles ?? [])]
        .filter((m) => m.type !== "document")
        .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)),
    [event?.mediaFiles]
  );
  // Folders the media was uploaded in, shown as albums
  const [album, setAlbum] = useState("");
  const albums = useMemo(() => albumsOf(allMedia), [allMedia]);
  const albumMedia = useMemo(() => (album ? allMedia.filter((m) => m.folderPath === album) : allMedia), [allMedia, album]);
  const visibleMedia = useMemo(() => (tab === "all" ? albumMedia : albumMedia.filter((m) => m.type === tab)), [albumMedia, tab]);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);

  const downloadSelection = async (items: MediaFile[], name: string) => {
    if (zipProgress) return;
    try {
      const result = await downloadMedia(items, name, (done, total) => setZipProgress({ done, total }));
      if (result?.failed) toast.warn(`${result.failed} file(s) could not be added to the ZIP`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setZipProgress(null);
    }
  };
  const summary = useMemo(() => mediaSummary(event?.mediaFiles), [event?.mediaFiles]);

  const handleUploaded = useCallback((files: MediaFile[]) => {
    setEvent((prev) => {
      if (!prev) return prev;
      const firstImage = files.find((f) => f.type === "image");
      return {
        ...prev,
        mediaFiles: [...prev.mediaFiles, ...files],
        coverPublicId: prev.coverPublicId || firstImage?.publicId || "",
      };
    });
    // New photos are scanned for faces right away (after the state above has rendered)
    if (files.some((f) => f.type === "image")) setAutoScanTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (autoScanTick) peopleRef.current?.scan();
  }, [autoScanTick]);

  const handlePeopleChange = useCallback((people: Person[], scannedIds: string[]) => {
    const scanned = new Set(scannedIds);
    setEvent((prev) =>
      prev
        ? { ...prev, people, mediaFiles: prev.mediaFiles.map((m) => (scanned.has(m.publicId) ? { ...m, facesScanned: true } : m)) }
        : prev
    );
  }, []);

  const handlePeopleReset = useCallback(() => {
    setEvent((prev) => (prev ? { ...prev, people: [], mediaFiles: prev.mediaFiles.map((m) => ({ ...m, facesScanned: false })) } : prev));
  }, []);

  const toggleSelect = (publicId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });

  const exitSelection = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const setCover = async (media: MediaFile) => {
    try {
      await api(`/events/${id}/cover`, { method: "PUT", body: { publicId: media.publicId } });
      setEvent((prev) => (prev ? { ...prev, coverPublicId: media.publicId } : prev));
      toast.success("Cover photo updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || !event) return;
    setDeleting(true);
    try {
      if (pendingDelete.kind === "event") {
        await api(`/events/${id}`, { method: "DELETE" });
        toast.success("Event deleted");
        router.push("/events");
        return;
      }

      const ids = pendingDelete.items.map((m) => m.publicId);
      if (ids.length === 1) {
        await api(`/events/${id}/media/${encodeURIComponent(ids[0])}`, { method: "DELETE" });
      } else {
        await api(`/events/${id}/media/bulk-delete`, { method: "POST", body: { publicIds: ids } });
      }
      const removed = new Set(ids);
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              mediaFiles: prev.mediaFiles.filter((m) => !removed.has(m.publicId)),
              coverPublicId: removed.has(prev.coverPublicId) ? "" : prev.coverPublicId,
            }
          : prev
      );
      toast.success(`Deleted ${ids.length} file(s)`);
      exitSelection();
      setPendingDelete(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <p className="font-semibold">Couldn&apos;t open this event</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{error ?? "Event not found"}</p>
        <Link href="/events" className={`${btn.secondary} mt-3.5`}>
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
      </div>
    );
  }

  const type = EVENT_TYPES[event.eventType] ?? EVENT_TYPES.other;
  const phaseKey = eventPhase(event);
  const phase = PHASE_STYLES[phaseKey];
  const cover = coverImage(event);
  const tabs: { key: MediaTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: albumMedia.length },
    { key: "image", label: "Photos", count: albumMedia.filter((m) => m.type === "image").length },
    { key: "video", label: "Videos", count: albumMedia.filter((m) => m.type === "video").length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 dark:text-zinc-400">
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      {/* Cover hero */}
      <section className="relative overflow-hidden rounded-2xl shadow-sm">
        <div className={`absolute inset-0 bg-gradient-to-br ${EVENT_GRADIENTS[event.eventType] ?? EVENT_GRADIENTS.other}`} />
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cloudinaryUrl(cover.url, "c_fill,w_1600,h_600,g_auto,q_auto,f_auto")} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

        <div className="relative flex min-h-[150px] flex-col justify-between gap-3 p-4 sm:min-h-[170px] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-800">{type.label}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                <span className={`h-1.5 w-1.5 rounded-full ${PHASE_DOTS[phaseKey]}`} /> {phase.label}
              </span>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <button className={heroBtn} onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" /> <span className="hidden sm:inline">Edit</span>
                </button>
              )}
              {canDeleteEvent && (
                <button className={`${heroBtn} hover:bg-red-500/80`} onClick={() => setPendingDelete({ kind: "event" })} aria-label="Delete event">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="text-white">
            <h2 className="text-xl font-bold tracking-tight drop-shadow sm:text-2xl">{event.eventName}</h2>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/85">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> {formatEventDate(event.eventDate, { weekday: "long" })}
                {event.startTime && ` · ${formatTime(event.startTime)}`}
              </span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {event.eventPlace}</span>
              {event.clientName && <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {event.clientName}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <div className="grid grid-cols-2 divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 lg:grid-cols-4 lg:divide-x">
        <Stat icon={ImageIcon} label="Photos" value={summary.photos} hint={formatBytes(summary.photoBytes)} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" />
        <Stat icon={Video} label="Videos" value={summary.videos} hint={formatBytes(summary.videoBytes)} tone="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" />
        <Stat icon={HardDrive} label="Storage" value={formatBytes(summary.totalBytes)} tone="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" />
        <Stat
          icon={Clock}
          label="Gallery open until"
          value={formatEventDate(event.expiryDate)}
          tone={phaseKey === "expired" ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800" : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Media */}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl border-b border-slate-100 bg-white/95 px-3 py-2.5 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/95">
            {selecting ? (
              <>
                <div className="flex items-center gap-2">
                  <button className={btn.ghost} onClick={exitSelection} aria-label="Cancel selection"><X className="h-4 w-4" /></button>
                  <span className="text-sm font-semibold">{selected.size} selected</span>
                  <button
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() => setSelected(selected.size === visibleMedia.length ? new Set() : new Set(visibleMedia.map((m) => m.publicId)))}
                  >
                    {selected.size === visibleMedia.length ? "Clear" : "Select all"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`${btn.secondary} py-1.5`}
                    disabled={selected.size === 0 || Boolean(zipProgress)}
                    onClick={() => downloadSelection(allMedia.filter((m) => selected.has(m.publicId)), `${event.eventName} - ${selected.size} files`)}
                  >
                    {zipProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {zipProgress ? `${zipProgress.done}/${zipProgress.total}` : "Download"}
                  </button>
                  {canDeleteMedia && (
                    <button
                      className={`${btn.danger} py-1.5`}
                      disabled={selected.size === 0}
                      onClick={() => setPendingDelete({ kind: "media", items: allMedia.filter((m) => selected.has(m.publicId)) })}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-900">
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                        tab === t.key
                          ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                    >
                      {t.label}
                      <span className={`text-xs ${tab === t.key ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>{t.count}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {allMedia.length > 0 && (
                    <button className={`${btn.ghost} py-1.5`} onClick={() => setSelecting(true)}>
                      <CheckSquare className="h-4 w-4" /> <span className="hidden sm:inline">Select</span>
                    </button>
                  )}
                  {canUpload && (
                    <>
                      <button
                        className={`${btn.secondary} py-1.5`}
                        onClick={() => uploaderRef.current?.openFolderPicker()}
                        title="Upload a whole folder; its folder names become albums"
                      >
                        <FolderUp className="h-4 w-4 text-amber-500" /> <span className="hidden sm:inline">Upload</span> Folder
                      </button>
                      <button
                        className={`${btn.primary} py-1.5`}
                        onClick={() => uploaderRef.current?.openPicker()}
                        title="Upload photos, videos or ZIP files"
                      >
                        <CloudUpload className="h-4 w-4" /> <span className="hidden sm:inline">Upload</span> Files
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {albums.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 px-3 py-2 [scrollbar-width:none] dark:border-zinc-900">
              <button
                onClick={() => setAlbum("")}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  album === "" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                All folders
              </button>
              {albums.map((a) => (
                <button
                  key={a.path}
                  onClick={() => setAlbum(a.path)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    album === a.path ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  <Folder className="h-3.5 w-3.5" /> {albumLabel(a.path)}
                  <span className={album === a.path ? "text-white/70" : "text-slate-400"}>{a.count}</span>
                </button>
              ))}
              {album && (
                <button
                  onClick={() => downloadSelection(albumMedia, `${event.eventName} - ${album.split("/").pop()}`)}
                  disabled={Boolean(zipProgress)}
                  className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                  {zipProgress ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {zipProgress ? `${zipProgress.done}/${zipProgress.total}` : "Download folder"}
                </button>
              )}
            </div>
          )}

          {visibleMedia.length === 0 ? (
            canUpload && allMedia.length === 0 ? (
              <button
                onClick={() => uploaderRef.current?.openPicker()}
                className="m-3 flex w-[calc(100%-1.5rem)] flex-col items-center rounded-xl border-2 border-dashed border-slate-200 px-4 py-10 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-zinc-800 dark:hover:bg-blue-950/20"
              >
                <span className="rounded-full bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"><CloudUpload className="h-6 w-6" /></span>
                <p className="mt-3 text-sm font-semibold">Add the first photos and videos</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Click to browse, or drag files anywhere on this page</p>
              </button>
            ) : (
              <div className="px-4 py-10 text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-700" />
                <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">
                  {allMedia.length === 0 ? "No photos or videos yet." : `No ${tab === "image" ? "photos" : "videos"} yet.`}
                </p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-3 gap-1.5 p-2 sm:grid-cols-4 xl:grid-cols-5">
              {visibleMedia.map((media, i) => {
                const isSelected = selected.has(media.publicId);
                const isCover = event.coverPublicId === media.publicId;
                return (
                  <div
                    key={media.publicId}
                    className={`group relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-zinc-900 ${isSelected ? "ring-[3px] ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950" : ""}`}
                  >
                    <button
                      className="h-full w-full"
                      onClick={() => (selecting ? toggleSelect(media.publicId) : setViewerIndex(i))}
                      aria-label={selecting ? `Select ${media.originalName}` : `Open ${media.originalName}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbUrl(media)}
                        alt={media.originalName}
                        loading="lazy"
                        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isSelected ? "scale-95" : ""}`}
                      />
                    </button>

                    {media.type === "video" && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="rounded-full bg-black/55 p-2 text-white backdrop-blur-sm"><Play className="h-4 w-4 fill-white" /></span>
                      </span>
                    )}

                    {isCover && (
                      <span className="pointer-events-none absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950 shadow">
                        <Star className="h-2.5 w-2.5 fill-amber-950" /> Cover
                      </span>
                    )}

                    {selecting ? (
                      <span className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-white/90 text-blue-600 shadow">
                        {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-slate-400" />}
                      </span>
                    ) : (
                      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        {media.type === "image" && !isCover && canEdit && (
                          <button onClick={() => setCover(media)} className="rounded-md bg-black/55 p-1.5 text-white backdrop-blur-sm hover:bg-amber-500" title="Set as cover" aria-label="Set as cover">
                            <Star className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <a href={downloadUrl(media)} className="rounded-md bg-black/55 p-1.5 text-white backdrop-blur-sm hover:bg-blue-600" title="Download" aria-label="Download">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        {canDeleteMedia && (
                          <button
                            onClick={() => setPendingDelete({ kind: "media", items: [media] })}
                            className="rounded-md bg-black/55 p-1.5 text-white backdrop-blur-sm hover:bg-red-500"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <QrCard
            eventId={event._id}
            eventName={event.eventName}
            eventDate={event.eventDate}
            qrCode={event.qrCode}
            guestUrl={guestUrl}
            canRegenerate={canEdit}
            onRegenerated={(qrCode, url) => {
              setEvent((prev) => (prev ? { ...prev, qrCode } : prev));
              setGuestUrl(url);
            }}
          />

          <PeopleCard ref={peopleRef} event={event} canScan={canUpload} onChange={handlePeopleChange} onReset={handlePeopleReset} />

          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Client</h3>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                {(event.clientName || "?").split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{event.clientName || "No client added"}</p>
                {event.clientEmail && (
                  <a href={`mailto:${event.clientEmail}`} className="flex items-center gap-1 truncate text-xs text-slate-500 hover:text-blue-600 dark:text-zinc-400">
                    <Mail className="h-3 w-3 shrink-0" /> {event.clientEmail}
                  </a>
                )}
              </div>
            </div>
            {event.clientPhone && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={`tel:${event.clientPhone}`} className={`${btn.secondary} py-1.5`}><Phone className="h-4 w-4" /> Call</a>
                <a href={whatsappLink(event.clientPhone)} target="_blank" rel="noreferrer" className={`${btn.secondary} py-1.5 text-emerald-700 dark:text-emerald-400`}>
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            )}
            {event.description && (
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-zinc-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Notes</h3>
                <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600 dark:text-zinc-300">{event.description}</p>
              </div>
            )}
          </section>
        </aside>
      </div>

      {canUpload && <MediaUploader ref={uploaderRef} eventId={event._id} onUploaded={handleUploaded} />}

      <MediaViewer
        media={visibleMedia}
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        onDelete={canDeleteMedia ? (media) => setPendingDelete({ kind: "media", items: [media] }) : undefined}
      />

      <EventFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        event={event}
        onSaved={(updated) => setEvent((prev) => (prev ? { ...prev, ...updated } : updated))}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={pendingDelete?.kind === "event" ? "Delete this event?" : "Delete files?"}
        confirmLabel={pendingDelete?.kind === "event" ? "Delete event" : "Delete"}
        message={
          pendingDelete?.kind === "event" ? (
            <>
              <strong>{event.eventName}</strong> and all {event.mediaFiles.length} photos and videos will be permanently deleted.
              Guests will no longer be able to open the gallery. This can&apos;t be undone.
            </>
          ) : (
            <>
              {pendingDelete?.kind === "media" && pendingDelete.items.length === 1
                ? <><strong>{pendingDelete.items[0].originalName}</strong> will be permanently deleted.</>
                : <>{pendingDelete?.kind === "media" ? pendingDelete.items.length : 0} files will be permanently deleted.</>}{" "}
              This can&apos;t be undone.
            </>
          )
        }
      />
    </div>
  );
}
