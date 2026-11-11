"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  ExternalLink,
  HardDrive,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  User,
  Video,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  coverImage,
  EVENT_GRADIENTS,
  EVENT_TYPES,
  eventPhase,
  EventPhase,
  eventTypeLabel,
  formatEventDate,
  formatTime,
  mediaSummary,
  PHASE_DOTS,
  PHASE_STYLES,
  StudioEvent,
  thumbUrl,
  toDateInput,
  todayInput,
} from "@/lib/events";
import { formatBytes } from "@/lib/format";
import { initials } from "@/lib/team";
import EventFormDialog from "@/components/studio/EventFormDialog";
import { btn, inputClass } from "@/components/studio/Modal";
import RequirePermission from "@/components/studio/RequirePermission";
import { useAuth } from "@/lib/auth";

type PhaseFilter = "all" | EventPhase;
type SortKey = "date-desc" | "date-asc" | "created-desc";

const PHASE_TABS: { key: PhaseFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "expired", label: "Expired" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

// Whole days from today to a calendar date (negative = in the past)
const daysUntil = (value: string) => Math.round((Date.parse(toDateInput(value)) - Date.parse(todayInput())) / 86400000);

const dayParts = (value: string) => {
  const d = new Date(value);
  return {
    day: d.getUTCDate(),
    month: d.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }),
    weekday: d.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" }),
  };
};

const monthHeading = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

const guestLink = (id: string) => `${window.location.origin}/event/${id}`;

/* ================= CARD ================= */

function CalendarTile({ date, className = "" }: { date: string; className?: string }) {
  const { day, month } = dayParts(date);
  return (
    <span className={`flex w-9 flex-col items-center overflow-hidden rounded-lg bg-white/95 text-slate-900 shadow-md backdrop-blur ${className}`}>
      <span className="w-full bg-blue-600 text-center text-[8px] font-bold uppercase leading-[14px] tracking-wider text-white">{month}</span>
      <span className="py-0.5 text-sm font-bold leading-none">{day}</span>
    </span>
  );
}

// "Gallery open · 22 days left" with a bar that empties as the expiry date nears
function GalleryLife({ event }: { event: StudioEvent }) {
  const left = daysUntil(event.expiryDate);
  if (left < 0)
    return <p className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500"><Clock className="h-3 w-3" /> Gallery closed {formatEventDate(event.expiryDate)}</p>;
  const span = Math.max(1, daysUntil(event.expiryDate) - daysUntil(event.createdAt));
  const share = Math.max(4, Math.min(100, (left / span) * 100));
  return (
    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-400">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full ${left <= 7 ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${share}%` }} />
      </div>
      <span className={`shrink-0 ${left <= 7 ? "font-semibold text-amber-600 dark:text-amber-400" : ""}`}>
        {left === 0 ? "Closes today" : `${left}d left`}
      </span>
    </div>
  );
}

function EventCard({ event, index }: { event: StudioEvent; index: number }) {
  const cover = coverImage(event);
  const summary = mediaSummary(event.mediaFiles);
  const phaseKey = eventPhase(event);
  const phase = PHASE_STYLES[phaseKey];
  const type = EVENT_TYPES[event.eventType] ?? EVENT_TYPES.other;
  const [copied, setCopied] = useState(false);

  // A few more photos peeking out under the cover
  const strip = (event.mediaFiles ?? []).filter((m) => m.type === "image" && m.publicId !== cover?.publicId).slice(0, 3);
  const extra = summary.photos + summary.videos - 1 - strip.length;

  const copyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(guestLink(event._id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.05, ease: EASE }}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10 hover:ring-blue-300 dark:bg-zinc-950 dark:ring-zinc-800 dark:hover:shadow-black/60 dark:hover:ring-blue-800"
    >
      <Link href={`/events/${event._id}`} className="absolute inset-0 z-10" aria-label={`Open ${event.eventName}`} />

      <div className="relative aspect-[4/3] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl(cover, 480)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
          />
        ) : (
          <div className={`relative flex h-full items-center justify-center bg-gradient-to-br ${EVENT_GRADIENTS[event.eventType] ?? EVENT_GRADIENTS.other}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
            <div className="relative flex flex-col items-center text-white/80">
              <Camera className="h-7 w-7" />
              <span className="mt-1 text-[11px] font-medium">No photos yet</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/20" />

        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <CalendarTile date={event.eventDate} />
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
            <span className={`h-1.5 w-1.5 rounded-full ${PHASE_DOTS[phaseKey]} ${phaseKey === "upcoming" ? "animate-pulse" : ""}`} /> {phase.label}
          </span>
        </div>

        {/* Quick actions, shown on hover (above the card link) */}
        <div className="absolute right-2 top-9 z-20 flex translate-x-2 flex-col gap-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <button
            onClick={copyLink}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur hover:bg-white hover:text-blue-600"
            title="Copy guest link"
            aria-label="Copy guest link"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Link2 className="h-3.5 w-3.5" />}
          </button>
          <a
            href={`/event/${event._id}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur hover:bg-white hover:text-blue-600"
            title="Open guest gallery"
            aria-label="Open guest gallery"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="absolute inset-x-2.5 bottom-2.5 text-white">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">{type.label}</p>
              <h3 className="truncate text-sm font-bold leading-tight drop-shadow">{event.eventName}</h3>
              <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-[11px] text-white/75">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{event.eventPlace}{event.startTime && ` · ${formatTime(event.startTime)}`}</span>
              </p>
            </div>
          {strip.length > 0 && (
            <div className="hidden shrink-0 items-center sm:flex">
              {strip.map((m, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.publicId}
                  src={thumbUrl(m, 96)}
                  alt=""
                  loading="lazy"
                  className={`h-6 w-6 rounded-md object-cover ring-2 ring-black/40 transition-transform duration-500 ${i ? "-ml-1.5" : ""} group-hover:translate-x-[calc(var(--i)*3px)]`}
                  style={{ "--i": i } as React.CSSProperties}
                />
              ))}
              {extra > 0 && (
                <span className="-ml-1.5 flex h-6 min-w-6 items-center justify-center rounded-md bg-white/20 px-1 text-[9px] font-semibold ring-2 ring-black/40 backdrop-blur">
                  +{extra}
                </span>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="space-y-2 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[8px] font-bold text-white">
              {event.clientName ? initials(event.clientName) : <User className="h-3 w-3" />}
            </span>
            <span className={`truncate ${event.clientName ? "font-medium" : "text-slate-400 dark:text-zinc-500"}`}>{event.clientName || "No client"}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-0.5"><ImageIcon className="h-3 w-3 text-emerald-500" /> {summary.photos}</span>
            <span className="flex items-center gap-0.5"><Video className="h-3 w-3 text-rose-500" /> {summary.videos}</span>
          </span>
        </div>
        <GalleryLife event={event} />
      </div>
    </motion.div>
  );
}

/* ================= NEXT SHOOT SPOTLIGHT ================= */

function NextShoot({ event }: { event: StudioEvent }) {
  const days = daysUntil(event.eventDate);
  const cover = coverImage(event);
  const { day, month, weekday } = dayParts(event.eventDate);
  return (
    <Link
      href={`/events/${event._id}`}
      className="group relative flex overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/15"
    >
      <div className="relative w-20 shrink-0 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl(cover, 300)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${EVENT_GRADIENTS[event.eventType] ?? EVENT_GRADIENTS.other}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
      </div>
      <div className="min-w-0 flex-1 px-3 py-2.5 text-white">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
          <Sparkles className="h-3 w-3" /> Next shoot
        </p>
        <p className="mt-0.5 truncate text-sm font-bold">{event.eventName}</p>
        <p className="truncate text-[11px] text-white/70">
          {weekday}, {day} {month}
          {event.startTime && ` · ${formatTime(event.startTime)}`} · {event.eventPlace}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-900">
            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
          </span>
          <ArrowRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

/* ================= LIST VIEW ================= */

function EventTable({ events }: { events: StudioEvent[] }) {
  const router = useRouter();
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-zinc-900 dark:text-zinc-500">
          <tr>
            <th className="px-4 py-3.5 font-semibold">Event</th>
            <th className="px-4 py-3.5 font-semibold">Client</th>
            <th className="px-4 py-3.5 font-semibold">Date</th>
            <th className="px-4 py-3.5 font-semibold">Media</th>
            <th className="px-4 py-3.5 font-semibold">Gallery</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
          {events.map((event) => {
            const cover = coverImage(event);
            const summary = mediaSummary(event.mediaFiles);
            const phaseKey = eventPhase(event);
            const phase = PHASE_STYLES[phaseKey];
            return (
              <tr key={event._id} onClick={() => router.push(`/events/${event._id}`)} className="group cursor-pointer transition-colors hover:bg-blue-50/40 dark:hover:bg-zinc-900/60">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-zinc-900">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbUrl(cover, 120)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className={`h-full w-full bg-gradient-to-br ${EVENT_GRADIENTS[event.eventType] ?? EVENT_GRADIENTS.other}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{event.eventName}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-zinc-500">{eventTypeLabel(event.eventType)} · {event.eventPlace}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p>{event.clientName || "—"}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">{event.clientPhone}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatEventDate(event.eventDate, { weekday: "short" })}
                  {event.startTime && <p className="text-xs text-slate-500 dark:text-zinc-500">{formatTime(event.startTime)}</p>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-3">
                    <span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> {summary.photos}</span>
                    <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5 text-rose-500" /> {summary.videos}</span>
                  </span>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">{formatBytes(summary.totalBytes)}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${phase.tone}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${PHASE_DOTS[phaseKey]}`} /> {phase.label}
                  </span>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">Until {formatEventDate(event.expiryDate)}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ================= PAGE ================= */

export default function EventsPageWithAccess() {
  return (
    <RequirePermission permission="events.view">
      <EventsPage />
    </RequirePermission>
  );
}

function EventsPage() {
  const router = useRouter();
  const { can } = useAuth();
  const canCreate = can("events.create");
  const [events, setEvents] = useState<StudioEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<PhaseFilter>("all");
  const [type, setType] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("events-view");
      if (saved === "grid" || saved === "list") setView(saved);
    } catch {}

    api<{ events: StudioEvent[] }>("/events/my-events")
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const changeView = (next: "grid" | "list") => {
    setView(next);
    try {
      localStorage.setItem("events-view", next);
    } catch {}
  };

  const counts = useMemo(() => {
    const result: Record<PhaseFilter, number> = { all: events.length, upcoming: 0, completed: 0, expired: 0 };
    events.forEach((e) => result[eventPhase(e)]++);
    return result;
  }, [events]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => phase === "all" || eventPhase(e) === phase)
      .filter((e) => type === "all" || e.eventType === type)
      .filter((e) => !q || [e.eventName, e.clientName, e.eventPlace, e.clientPhone, e.clientEmail].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => {
        if (sort === "created-desc") return +new Date(b.createdAt) - +new Date(a.createdAt);
        const diff = toDateInput(a.eventDate).localeCompare(toDateInput(b.eventDate));
        return sort === "date-asc" ? diff : -diff;
      });
  }, [events, search, phase, type, sort]);

  // Month sections when sorted by shoot date
  const groups = useMemo(() => {
    if (sort === "created-desc") return [{ title: "", events: visible }];
    const out: { title: string; events: StudioEvent[] }[] = [];
    for (const e of visible) {
      const title = monthHeading(e.eventDate);
      if (out.at(-1)?.title === title) out.at(-1)!.events.push(e);
      else out.push({ title, events: [e] });
    }
    return out;
  }, [visible, sort]);

  const totals = useMemo(() => mediaSummary(events.flatMap((e) => e.mediaFiles ?? [])), [events]);
  const nextShoot = useMemo(
    () => events.filter((e) => daysUntil(e.eventDate) >= 0).sort((a, b) => toDateInput(a.eventDate).localeCompare(toDateInput(b.eventDate)))[0],
    [events]
  );
  // Recent covers make the banner background
  const mosaic = useMemo(() => {
    const covers = events.map((e) => coverImage(e)).filter(Boolean) as NonNullable<ReturnType<typeof coverImage>>[];
    // Repeat a few covers so the strip is always full
    return covers.length ? Array.from({ length: 6 }, (_, i) => covers[i % covers.length]) : [];
  }, [events]);

  const stats = [
    { icon: CalendarDays, label: "events", value: String(events.length) },
    { icon: Sparkles, label: "upcoming", value: String(counts.upcoming) },
    { icon: ImageIcon, label: "photos", value: String(totals.photos) },
    { icon: Video, label: "videos", value: String(totals.videos) },
    { icon: HardDrive, label: "used", value: formatBytes(totals.totalBytes) },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* ================= HERO (compact) ================= */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-lg">
        {mosaic.length > 0 && (
          <div className="absolute inset-0 grid grid-cols-3 opacity-35 sm:grid-cols-6">
            {mosaic.map((m, i) => (
              <motion.div
                key={`${m.publicId}-${i}`}
                className="h-full overflow-hidden"
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.4, delay: i * 0.08, ease: EASE }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbUrl(m, 300)} alt="" className="h-full w-full object-cover" />
              </motion.div>
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-blue-950/50" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />

        <div className="relative flex flex-col gap-4 p-4 sm:p-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-200">Your galleries</p>
                <h2 className="text-2xl font-bold tracking-tight">Events</h2>
              </div>
              {canCreate && (
                <button
                  onClick={() => setFormOpen(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow transition-transform hover:scale-[1.03] lg:hidden"
                >
                  <CalendarPlus className="h-4 w-4" /> New
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stats.map((s, i) => (
                <motion.span
                  key={s.label}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs ring-1 ring-white/10 backdrop-blur-md"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: EASE }}
                >
                  <s.icon className="h-3.5 w-3.5 text-white/60" />
                  <span className="font-bold">{loading ? "—" : s.value}</span>
                  <span className="text-white/60">{s.label}</span>
                </motion.span>
              ))}
            </div>
          </div>

          {nextShoot && (
            <motion.div className="lg:w-80" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: EASE }}>
              <NextShoot event={nextShoot} />
            </motion.div>
          )}

          {canCreate && (
            <button
              onClick={() => setFormOpen(true)}
              className="hidden shrink-0 items-center gap-2 self-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition-transform hover:scale-[1.03] lg:inline-flex"
            >
              <CalendarPlus className="h-4 w-4" /> New event
            </button>
          )}
        </div>
      </section>

      {/* ================= TOOLBAR ================= */}
      <div className="sticky top-0 z-20 -mx-1 flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 xl:flex-row xl:items-center">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-zinc-900">
          {PHASE_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPhase(key)}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                phase === key ? "text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {phase === key && (
                <motion.span layoutId="phase-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-zinc-800" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{label}</span>
              <span className={`relative rounded-full px-1.5 text-[11px] font-semibold ${phase === key ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} py-2 pl-9`} placeholder="Search event, client, venue or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <select className={`${inputClass} py-2 sm:w-36`} value={type} onChange={(e) => setType(e.target.value)} aria-label="Event type">
              <option value="all">All types</option>
              {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select className={`${inputClass} py-2 sm:w-40`} value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
              <option value="date-desc">Newest date</option>
              <option value="date-asc">Oldest date</option>
              <option value="created-desc">Recently added</option>
            </select>
            <div className="flex shrink-0 rounded-xl border border-slate-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
              {(["grid", "list"] as const).map((mode) => {
                const Icon = mode === "grid" ? LayoutGrid : List;
                return (
                  <button
                    key={mode}
                    onClick={() => changeView(mode)}
                    aria-label={`${mode} view`}
                    className={`rounded-lg p-1.5 transition-colors ${view === mode ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-zinc-950 dark:ring-zinc-800">
              <div className="aspect-[4/3] animate-pulse bg-slate-200 dark:bg-zinc-900" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-zinc-900" />
                <div className="h-2 w-full animate-pulse rounded bg-slate-100 dark:bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-lg shadow-blue-600/30">
            {events.length === 0 ? <CalendarPlus className="h-7 w-7" /> : <Search className="h-7 w-7" />}
          </div>
          <h3 className="mt-3.5 text-lg font-semibold">{events.length === 0 ? "Create your first event" : "No events match"}</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-zinc-400">
            {events.length === 0 ? "Add an event, upload the photos and videos, then share the QR code with guests." : "Try a different search or filter."}
          </p>
          {events.length === 0 && canCreate && (
            <button className={`${btn.primary} mt-4`} onClick={() => setFormOpen(true)}>
              <CalendarPlus className="h-4 w-4" /> New event
            </button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <section key={group.title || "all"}>
                {group.title && (
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-600 dark:text-zinc-300">{group.title}</h3>
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {group.events.length}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-zinc-800" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {group.events.map((event, i) => (
                    <EventCard key={event._id} event={event} index={i} />
                  ))}
                </div>
              </section>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EventTable events={visible} />
      )}

      <EventFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={(created) => router.push(`/events/${created._id}`)} />
    </div>
  );
}
