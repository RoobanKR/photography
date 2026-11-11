"use client";

// Public guest gallery: opened from the event QR code or link

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Camera,
  CheckCircle2,
  CheckSquare,
  Circle,
  Folder,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ImageIcon,
  Loader2,
  MapPin,
  Play,
  ScanFace,
  SlidersHorizontal,
  Users,
  Video,
  X,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { cloudinaryUrl, formatEventDate, formatTime } from "@/lib/events";
import { detectFaces, FaceBox, loadFaceApi, Person } from "@/lib/faces";
import FaceThumb from "@/components/faces/FaceThumb";
import { STUDIO } from "@/components/website/content";
import { albumLabel, albumsOf, downloadMedia } from "@/lib/download";

interface GalleryMedia {
  publicId: string;
  url: string;
  type: "image" | "video" | "document";
  originalName: string;
  uploadedAt: string;
  folderPath?: string;
  size?: number;
  people?: string[];
}

interface GalleryEvent {
  _id: string;
  eventName: string;
  eventType: string;
  description?: string;
  eventDate: string;
  startTime?: string;
  eventPlace: string;
  coverPublicId?: string;
  mediaFiles: GalleryMedia[];
  people?: Person[];
  faceSearchReady?: boolean;
}

type LoadState = { kind: "loading" } | { kind: "ready"; event: GalleryEvent } | { kind: "expired" } | { kind: "error"; message: string };

type Filter = { kind: "all" } | { kind: "person"; personId: string } | { kind: "mine"; publicIds: string[] };

const EASE = [0.22, 1, 0.36, 1] as const;

const gridUrl = (m: GalleryMedia) =>
  m.type === "video"
    ? cloudinaryUrl(m.url, "so_1,c_limit,w_700,q_auto").replace(/\.\w+$/, ".jpg")
    : cloudinaryUrl(m.url, "c_limit,w_700,q_auto,f_auto");

const downloadUrl = (m: GalleryMedia) => cloudinaryUrl(m.url, "fl_attachment");

export default function GuestGalleryPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [tab, setTab] = useState<"all" | "image" | "video">("all");
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [viewer, setViewer] = useState<number | null>(null);
  const [finderOpen, setFinderOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [album, setAlbum] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`${API_URL}/events/public/${eventId}`);
      const data = await res.json().catch(() => ({}));
      if (res.status === 410) return setState({ kind: "expired" });
      if (!res.ok) return setState({ kind: "error", message: data.message || "This gallery could not be found." });
      setState({ kind: "ready", event: data.event });
    } catch {
      setState({ kind: "error", message: "We couldn't reach the gallery. Check your connection and try again." });
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const event = state.kind === "ready" ? state.event : null;

  const media = useMemo(
    () =>
      (event?.mediaFiles ?? [])
        .filter((m) => m.type !== "document")
        .sort((a, b) => +new Date(a.uploadedAt) - +new Date(b.uploadedAt)),
    [event]
  );

  // Media left after the person / "your photos" filter; the tabs count and split this
  const albums = useMemo(() => albumsOf(media), [media]);

  const filtered = useMemo(() => {
    const inAlbum = album ? media.filter((m) => m.folderPath === album) : media;
    if (filter.kind === "person") return inAlbum.filter((m) => m.people?.includes(filter.personId));
    if (filter.kind === "mine") {
      const order = new Map(filter.publicIds.map((id, i) => [id, i]));
      return inAlbum.filter((m) => order.has(m.publicId)).sort((a, b) => order.get(a.publicId)! - order.get(b.publicId)!);
    }
    return inAlbum;
  }, [media, filter, album]);

  const visible = useMemo(() => (tab === "all" ? filtered : filtered.filter((m) => m.type === tab)), [filtered, tab]);

  const counts = useMemo(
    () => ({
      all: filtered.length,
      image: filtered.filter((m) => m.type === "image").length,
      video: filtered.filter((m) => m.type === "video").length,
    }),
    [filtered]
  );
  const totals = useMemo(
    () => ({ image: media.filter((m) => m.type === "image").length, video: media.filter((m) => m.type === "video").length }),
    [media]
  );

  const photoById = useMemo(() => new Map(media.map((m) => [m.publicId, m])), [media]);
  const people = (event?.people ?? []).filter((p) => photoById.has(p.coverPublicId));

  const scrollToGallery = () => galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const toggleSelected = (publicId: string) =>
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

  const download = async (items: GalleryMedia[], name: string) => {
    if (zipProgress || !items.length) return;
    try {
      const result = await downloadMedia(items, name, (done, total) => setZipProgress({ done, total }));
      if (result?.failed) setNotice(`${result.failed} file(s) couldn't be added to the ZIP.`);
      exitSelection();
    } catch (err: any) {
      setNotice(err?.message || "Download failed. Please try again.");
    } finally {
      setZipProgress(null);
    }
  };

  const applyFilter = (next: Filter) => {
    setFilter(next);
    setTab("all");
    setTimeout(scrollToGallery, 50);
  };

  if (state.kind === "loading") return <FullScreenMessage loading title="Opening gallery" />;
  if (state.kind === "expired")
    return (
      <FullScreenMessage
        title="This gallery has closed"
        text={`The sharing period for this event has ended. Please contact ${STUDIO.name} if you still need your photos.`}
        action={<a href={`https://wa.me/${STUDIO.whatsapp}`} className={goldButton}>Contact {STUDIO.name}</a>}
      />
    );
  if (state.kind === "error")
    return (
      <FullScreenMessage
        title="Gallery unavailable"
        text={state.message}
        action={<button onClick={load} className={goldButton}>Try again</button>}
      />
    );

  const ev = state.event;
  const cover = media.find((m) => m.publicId === ev.coverPublicId && m.type === "image") ?? media.find((m) => m.type === "image");
  const activePerson = filter.kind === "person" ? people.find((p) => p.personId === filter.personId) : null;

  return (
    <div className="min-h-screen bg-[#f5f1ec] font-sans text-stone-800">
      {/* ================= TOP BAR ================= */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          scrolled ? "bg-[#f5f1ec]/95 py-3 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-md" : "py-5"
        }`}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/" className="flex shrink-0 flex-col leading-none">
            <span className={`font-serif text-2xl tracking-[0.25em] transition-colors ${scrolled ? "text-[#b8935a]" : "text-white"}`}>{STUDIO.name}</span>
            <span className={`mt-1 text-[7px] uppercase tracking-[0.45em] transition-colors ${scrolled ? "text-stone-500" : "text-white/70"}`}>
              {STUDIO.tagline}
            </span>
          </Link>
          <p className={`hidden min-w-0 truncate font-serif text-lg uppercase tracking-[0.15em] transition-opacity sm:block ${scrolled ? "opacity-100" : "opacity-0"}`}>
            {ev.eventName}
          </p>
          <button
            onClick={() => setFinderOpen(true)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors ${
              scrolled ? "bg-stone-900 text-white hover:bg-[#b8935a]" : "bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
            }`}
          >
            <ScanFace className="h-4 w-4" /> <span className="hidden sm:inline">Find my photos</span><span className="sm:hidden">Find me</span>
          </button>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative flex h-[70svh] min-h-[420px] items-end overflow-hidden bg-[#141210]">
        {cover && (
          <motion.img
            src={cloudinaryUrl(cover.url, "c_limit,w_2000,q_auto,f_auto")}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: 1.12, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, ease: EASE }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
        <div className="relative mx-auto w-full max-w-[1500px] px-4 pb-10 text-white sm:px-8 sm:pb-14">
          <motion.p
            className="text-[10px] font-medium uppercase tracking-[0.45em] text-[#e6c88f]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: EASE }}
          >
            {STUDIO.name} presents
          </motion.p>
          <motion.h1
            className="mt-3 max-w-4xl font-serif text-4xl font-light uppercase leading-tight tracking-[0.12em] sm:text-6xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.45, ease: EASE }}
          >
            {ev.eventName}
          </motion.h1>
          <motion.div
            className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatEventDate(ev.eventDate, { weekday: "short" })}</span>
            {ev.startTime && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {formatTime(ev.startTime)}</span>}
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {ev.eventPlace}</span>
            <span className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> {totals.image} photos{totals.video ? ` · ${totals.video} videos` : ""}</span>
          </motion.div>
          <motion.div
            className="mt-7 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: EASE }}
          >
            <button onClick={() => setFinderOpen(true)} className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-900 transition-colors hover:bg-[#e6c88f]">
              <ScanFace className="h-4 w-4" /> Find my photos
            </button>
            <button onClick={scrollToGallery} className="rounded-full border border-white/50 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition-colors hover:bg-white/10">
              View gallery
            </button>
          </motion.div>
        </div>
      </section>

      {/* ================= PEOPLE ================= */}
      {people.length > 0 && (
        <section className="border-b border-stone-200/80 bg-white">
          <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500">
                <Users className="h-4 w-4 text-[#b8935a]" /> People
              </h2>
              <span className="text-xs text-stone-400">Tap a face to see their photos</span>
            </div>
            <div className="-mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
              {people.map((person, i) => {
                const active = filter.kind === "person" && filter.personId === person.personId;
                return (
                  <motion.button
                    key={person.personId}
                    onClick={() => applyFilter(active ? { kind: "all" } : { kind: "person", personId: person.personId })}
                    className="group flex shrink-0 flex-col items-center gap-2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 12) * 0.04, duration: 0.5, ease: EASE }}
                  >
                    <span className={`rounded-full p-[3px] transition-all ${active ? "bg-gradient-to-br from-[#d6b26e] to-[#9a7440]" : "bg-transparent group-hover:bg-stone-200"}`}>
                      <FaceThumb url={photoById.get(person.coverPublicId)!.url} box={person.coverBox} className="h-16 w-16 ring-2 ring-white sm:h-20 sm:w-20" />
                    </span>
                    <span className={`text-xs ${active ? "font-semibold text-[#9a7440]" : "text-stone-500"}`}>{person.photoCount} photos</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= GALLERY ================= */}
      <main ref={galleryRef} className="mx-auto max-w-[1500px] scroll-mt-20 px-2 pb-28 pt-6 sm:px-8">
        {albums.length > 0 && (
          <div className="-mx-2 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {[{ path: "", count: media.length }, ...albums].map((a) => (
              <button
                key={a.path || "all"}
                onClick={() => {
                  setAlbum(a.path);
                  setSelected(new Set());
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  album === a.path ? "border-[#b8935a] bg-[#b8935a] text-white" : "border-stone-200 bg-white text-stone-600 hover:border-[#b8935a]"
                }`}
              >
                <Folder className="h-3.5 w-3.5" />
                {a.path ? albumLabel(a.path) : "All albums"}
                <span className={album === a.path ? "text-white/70" : "text-stone-400"}>{a.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-2 sm:px-0">
          <div className="flex gap-1 rounded-full bg-white p-1 shadow-sm">
            {(
              [
                { key: "all", label: "All", icon: null },
                { key: "image", label: "Photos", icon: ImageIcon },
                { key: "video", label: "Videos", icon: Video },
              ] as const
            )
              .filter((t) => t.key !== "video" || totals.video > 0)
              .map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    tab === t.key ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  {t.icon && <t.icon className="h-3.5 w-3.5" />} {t.label}
                  <span className={tab === t.key ? "text-white/60" : "text-stone-400"}>{counts[t.key]}</span>
                </button>
              ))}
          </div>

          <AnimatePresence>
            {filter.kind !== "all" && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setFilter({ kind: "all" })}
                className="flex items-center gap-2 rounded-full bg-[#b8935a] py-1 pl-1 pr-3 text-xs font-medium text-white shadow-sm hover:bg-[#9a7440]"
              >
                {activePerson ? (
                  <FaceThumb url={photoById.get(activePerson.coverPublicId)!.url} box={activePerson.coverBox} className="h-6 w-6" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20"><ScanFace className="h-3.5 w-3.5" /></span>
                )}
                {filter.kind === "mine" ? "Your photos" : "Their photos"} · {filtered.length}
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>

          {visible.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => (selecting ? exitSelection() : setSelecting(true))}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium shadow-sm transition-colors ${
                  selecting ? "bg-stone-900 text-white" : "bg-white text-stone-700 hover:text-stone-900"
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" /> {selecting ? "Cancel" : "Select"}
              </button>
              {!selecting && (
                <button
                  onClick={() => download(visible, [ev.eventName, album.split("/").pop()].filter(Boolean).join(" - "))}
                  disabled={Boolean(zipProgress)}
                  className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:text-stone-900"
                  title="Download everything shown as a ZIP"
                >
                  <Download className="h-3.5 w-3.5" />
                  {album ? "Download album" : filter.kind === "all" ? "Download all" : "Download these"}
                </button>
              )}
            </div>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="py-24 text-center">
            <Camera className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-4 font-serif text-2xl text-stone-600">
              {filter.kind === "mine" ? "We couldn't find you in this gallery" : "No photos here yet"}
            </p>
            <p className="mt-2 text-sm text-stone-400">
              {filter.kind === "mine" ? "Try a clearer selfie facing the camera, or browse all photos." : "Check back soon, the studio may still be uploading."}
            </p>
            {filter.kind !== "all" && (
              <button onClick={() => setFilter({ kind: "all" })} className={`${goldButton} mt-6`}>Show all photos</button>
            )}
          </div>
        ) : (
          <div className="columns-2 gap-2 sm:gap-3 md:columns-3 xl:columns-4">
            {visible.map((m, i) => (
              <GridItem
                key={m.publicId}
                media={m}
                index={i}
                selecting={selecting}
                selected={selected.has(m.publicId)}
                onOpen={() => (selecting ? toggleSelected(m.publicId) : setViewer(i))}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white py-10 text-center">
        <Link href="/" className="font-serif text-3xl tracking-[0.3em] text-[#b8935a]">{STUDIO.name}</Link>
        <p className="mt-2 text-[9px] uppercase tracking-[0.45em] text-stone-400">{STUDIO.tagline}</p>
        <p className="mt-4 text-xs text-stone-400">Photos are for personal use. Please credit {STUDIO.name} when sharing.</p>
      </footer>

      {/* Selection bar */}
      <AnimatePresence>
        {selecting && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="mx-auto flex max-w-[1500px] items-center gap-3">
              <button onClick={exitSelection} className="rounded-full p-2 text-stone-500 hover:bg-stone-100" aria-label="Cancel selection">
                <X className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-800">{selected.size} selected</p>
                <button
                  onClick={() => setSelected(selected.size === visible.length ? new Set() : new Set(visible.map((m) => m.publicId)))}
                  className="text-xs font-medium text-[#9a7440] hover:underline"
                >
                  {selected.size === visible.length ? "Clear" : `Select all ${visible.length}`}
                </button>
              </div>
              <button
                onClick={() => download(visible.filter((m) => selected.has(m.publicId)), `${ev.eventName} - ${selected.size} photos`)}
                disabled={selected.size === 0 || Boolean(zipProgress)}
                className={`${goldButton} ml-auto px-5 py-2.5 disabled:opacity-40`}
              >
                <Download className="h-4 w-4" /> Download{selected.size > 1 ? " ZIP" : ""}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZIP progress and messages */}
      <AnimatePresence>
        {(zipProgress || notice) && (
          <motion.div
            className={`fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-stone-900 px-5 py-3 text-sm text-white shadow-2xl ${selecting ? "bottom-24" : "bottom-6"}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {zipProgress ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#e6c88f]" />
                Preparing ZIP · {zipProgress.done} of {zipProgress.total}
              </>
            ) : (
              <>
                {notice}
                <button onClick={() => setNotice(null)} className="text-white/60 hover:text-white" aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Viewer media={visible} index={viewer} onIndex={setViewer} />

      <FinderModal
        open={finderOpen}
        onClose={() => setFinderOpen(false)}
        eventId={ev._id}
        ready={Boolean(ev.faceSearchReady)}
        onFound={(publicIds) => {
          setFinderOpen(false);
          applyFilter({ kind: "mine", publicIds });
        }}
      />
    </div>
  );
}

const goldButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#b8935a] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition-colors hover:bg-[#9a7440]";

/* ================= GRID ITEM ================= */
function GridItem({
  media,
  index,
  selecting,
  selected,
  onOpen,
}: {
  media: GalleryMedia;
  index: number;
  selecting: boolean;
  selected: boolean;
  onOpen: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <motion.button
      onClick={onOpen}
      className="group relative mb-2 block w-full overflow-hidden rounded-md bg-stone-200 sm:mb-3"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.06, ease: EASE }}
    >
      <img
        src={gridUrl(media)}
        alt={media.originalName}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full transition-all duration-500 ${selected ? "scale-[0.92] rounded-md" : "group-hover:scale-[1.04]"} ${loaded ? "opacity-100" : "min-h-40 opacity-0"}`}
      />
      <span className={`absolute inset-0 transition-colors duration-300 ${selected ? "bg-[#b8935a]/15" : "bg-black/0 group-hover:bg-black/15"}`} />
      {selecting && (
        <span className="absolute left-2 top-2 rounded-full bg-white/90 shadow">
          {selected ? <CheckCircle2 className="h-6 w-6 fill-[#b8935a] text-white" /> : <Circle className="h-6 w-6 text-stone-400" />}
        </span>
      )}
      {media.type === "video" && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </span>
      )}
    </motion.button>
  );
}

/* ================= VIEWER ================= */
function Viewer({ media, index, onIndex }: { media: GalleryMedia[]; index: number | null; onIndex: (i: number | null) => void }) {
  const touchX = useRef<number | null>(null);
  const current = index !== null ? media[index] : null;

  const go = useCallback(
    (step: number) => {
      if (index === null || !media.length) return;
      onIndex((index + step + media.length) % media.length);
    },
    [index, media.length, onIndex]
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [index, go, onIndex]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-stone-950/40 backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white/80">
            <span className="rounded-full bg-black/45 px-3 py-1 text-sm tabular-nums text-white backdrop-blur">{index! + 1} / {media.length}</span>
            <div className="flex items-center gap-1">
              <a href={downloadUrl(current)} className="flex items-center gap-2 rounded-full bg-black/45 px-3.5 py-2 text-sm text-white backdrop-blur hover:bg-black/65" title="Download">
                <Download className="h-5 w-5" /> <span className="hidden sm:inline">Download</span>
              </a>
              <button onClick={() => onIndex(null)} className="rounded-full bg-black/45 p-2 text-white backdrop-blur hover:bg-black/65" aria-label="Close">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 sm:px-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.publicId}
                className="flex h-full w-full items-center justify-center"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                {current.type === "video" ? (
                  <video src={current.url} controls autoPlay playsInline className="max-h-full max-w-full rounded-xl shadow-2xl shadow-black/50" />
                ) : (
                  <img src={cloudinaryUrl(current.url, "c_limit,w_2000,q_auto,f_auto")} alt={current.originalName} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl shadow-black/50" />
                )}
              </motion.div>
            </AnimatePresence>

            {media.length > 1 && (
              <>
                <button onClick={() => go(-1)} className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:block" aria-label="Previous">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={() => go(1)} className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:block" aria-label="Next">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================= FIND MY PHOTOS ================= */
const STRICTNESS = [
  { label: "Strict", value: 0.48, hint: "Fewer photos, almost no mistakes" },
  { label: "Normal", value: 0.55, hint: "Best for most people" },
  { label: "Loose", value: 0.6, hint: "More photos, may include look-alikes" },
];

// Shrinks big phone photos so detection stays fast
const toCanvas = (img: HTMLImageElement, max = 1000) => {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
};

function FinderModal({
  open,
  onClose,
  eventId,
  ready,
  onFound,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  ready: boolean;
  onFound: (publicIds: string[]) => void;
}) {
  const [preview, setPreview] = useState<{ url: string; box: FaceBox | null } | null>(null);
  const [status, setStatus] = useState<{ busy: boolean; text: string; error?: boolean } | null>(null);
  const [strictness, setStrictness] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Start downloading the face models as soon as the guest opens the finder
  useEffect(() => {
    if (open && ready) loadFaceApi().catch(() => {});
  }, [open, ready]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const search = async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview({ url, box: null });
    try {
      setStatus({ busy: true, text: "Preparing face search…" });
      await loadFaceApi();

      setStatus({ busy: true, text: "Looking at your photo…" });
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      const faces = await detectFaces(toCanvas(img));
      if (faces.length === 0) {
        setStatus({ busy: false, error: true, text: "No face found. Use a clear photo facing the camera, in good light." });
        return;
      }
      // Group selfies: use the biggest face
      const face = faces.reduce((a, b) => (b.box.w * b.box.h > a.box.w * a.box.h ? b : a));
      setPreview({ url, box: face.box });

      setStatus({ busy: true, text: "Searching the gallery…" });
      const res = await fetch(`${API_URL}/events/public/${eventId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor: face.descriptor, threshold: STRICTNESS[strictness].value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Search failed");

      const ids: string[] = data.matches.map((m: { publicId: string }) => m.publicId);
      if (ids.length === 0) {
        setStatus({ busy: false, error: true, text: "We couldn't find you. Try another selfie, or set matching to Loose." });
        return;
      }
      setStatus(null);
      setPreview(null);
      onFound(ids);
    } catch (err: any) {
      setStatus({ busy: false, error: true, text: err?.message || "Something went wrong. Please try again." });
    }
  };

  const close = () => {
    if (status?.busy) return;
    setStatus(null);
    setPreview(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="w-full max-w-sm overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 pb-0">
              <div>
                <h2 className="font-serif text-2xl uppercase tracking-[0.1em] text-stone-800">Find my photos</h2>
                <p className="mt-1 text-sm text-stone-500">Take a selfie and we&apos;ll show every photo you&apos;re in.</p>
              </div>
              <div className="flex shrink-0 items-center">
                {ready && (
                  <button
                    onClick={() => setShowSettings((s) => !s)}
                    className={`rounded-full p-2 transition-colors ${showSettings ? "bg-stone-100 text-stone-900" : "text-stone-400 hover:text-stone-700"}`}
                    aria-label="Matching settings"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                )}
                <button onClick={close} className="rounded-full p-2 text-stone-400 hover:text-stone-700" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {!ready ? (
                <div className="rounded-2xl bg-stone-50 p-5 text-center">
                  <ScanFace className="mx-auto h-8 w-8 text-stone-300" />
                  <p className="mt-3 text-sm text-stone-600">Face search isn&apos;t ready for this gallery yet.</p>
                  <p className="mt-1 text-xs text-stone-400">The studio is still preparing it. You can browse all photos meanwhile.</p>
                </div>
              ) : (
                <>
                  <AnimatePresence initial={false}>
                    {showSettings && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mb-4 rounded-2xl bg-stone-50 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">Matching</p>
                          <div className="mt-2 grid grid-cols-3 gap-1 rounded-full bg-white p-1">
                            {STRICTNESS.map((s, i) => (
                              <button
                                key={s.label}
                                onClick={() => setStrictness(i)}
                                className={`rounded-full py-1.5 text-xs font-medium transition-colors ${strictness === i ? "bg-stone-900 text-white" : "text-stone-500"}`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-stone-500">{STRICTNESS[strictness].hint}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={status?.busy}
                    className="group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-stone-200 p-4 text-left transition-colors hover:border-[#b8935a] disabled:cursor-wait"
                  >
                    <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 text-stone-400">
                      {preview ? (
                        preview.box ? (
                          <FaceThumb url={preview.url} box={preview.box} className="h-16 w-16" />
                        ) : (
                          <img src={preview.url} alt="" className="h-full w-full object-cover" />
                        )
                      ) : (
                        <Camera className="h-7 w-7" />
                      )}
                      {status?.busy && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </span>
                      )}
                    </span>
                    <span>
                      <span className="block font-medium text-stone-800">{preview ? "Use another photo" : "Take or upload a selfie"}</span>
                      <span className="mt-0.5 block text-xs text-stone-500">Face the camera, good light, no sunglasses</span>
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) search(file);
                    }}
                  />

                  {status && (
                    <p className={`mt-3 flex items-start gap-2 text-sm ${status.error ? "text-rose-600" : "text-stone-600"}`}>
                      {status.busy && <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />}
                      {status.text}
                    </p>
                  )}

                  <p className="mt-4 text-[11px] leading-relaxed text-stone-400">
                    Your selfie stays on this device. Only a face code is sent to search this gallery, and nothing is saved.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================= FULL-SCREEN STATES ================= */
function FullScreenMessage({ title, text, action, loading = false }: { title: string; text?: string; action?: React.ReactNode; loading?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#141210] px-6 text-center text-white">
      <Link href="/" className="font-serif text-4xl tracking-[0.3em] text-[#d6b26e]">{STUDIO.name}</Link>
      <p className="mt-2 text-[9px] uppercase tracking-[0.5em] text-white/40">{STUDIO.tagline}</p>
      {loading ? (
        <div className="mt-10 h-px w-40 overflow-hidden bg-white/10">
          <motion.div className="h-full w-1/2 bg-[#d6b26e]" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      ) : (
        <>
          <h1 className="mt-10 font-serif text-3xl uppercase tracking-[0.12em]">{title}</h1>
          {text && <p className="mt-3 max-w-md text-white/60">{text}</p>}
          {action && <div className="mt-8">{action}</div>}
        </>
      )}
    </div>
  );
}
