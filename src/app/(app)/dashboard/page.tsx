"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Clock,
  HardDrive,
  Image as ImageIcon,
  Inbox,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  Video,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Booking, bookingNumber, paymentState } from "@/lib/bookings";
import { eventTypeLabel, formatEventDate, formatTime, MediaFile, StudioEvent, thumbUrl, toDateInput, todayInput } from "@/lib/events";
import { formatBytes, formatDate, formatMoney, formatRelative } from "@/lib/format";
import { MEDIA_COLORS, StorageReport, usagePercent, usageTone } from "@/lib/storage";

function StatCard({ label, value, hint, icon: Icon, tone, href }: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  tone: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 truncate text-xs text-slate-400 dark:text-zinc-500">{hint}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

function Panel({ title, href, linkLabel = "View all", children, className = "" }: {
  title: string;
  href: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-zinc-900">
        <h3 className="font-semibold">{title}</h3>
        <Link href={href} className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-zinc-500">{children}</p>
);

function DateBadge({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
      <span className="text-[10px] font-bold uppercase">{date.toLocaleString(undefined, { month: "short", timeZone: "UTC" })}</span>
      <span className="text-lg font-bold leading-none">{date.getUTCDate()}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { user, status, can } = useAuth();
  const canEvents = can("events.view");
  const canBookings = can("bookings.view");
  const canStorage = can("storage.view");

  const [events, setEvents] = useState<StudioEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [storage, setStorage] = useState<StorageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    // Load only what this user may see; one failing section doesn't hide the others
    const jobs: Promise<unknown>[] = [];
    const failed: string[] = [];
    const track = <T,>(p: Promise<T>, onOk: (v: T) => void) =>
      jobs.push(p.then(onOk).catch((err) => failed.push(err.message)));

    if (canEvents) track(api<{ events: StudioEvent[] }>("/events/my-events"), (d) => setEvents(d.events));
    if (canBookings) track(api<{ bookings: Booking[] }>("/bookings"), (d) => setBookings(d.bookings));
    if (canStorage) track(api<StorageReport>("/storage"), setStorage);

    Promise.all(jobs).finally(() => {
      setErrors([...new Set(failed)]);
      setLoading(false);
    });
  }, [status, canEvents, canBookings, canStorage]);

  const data = useMemo(() => {
    const today = todayInput();
    const media = events.flatMap((e) => e.mediaFiles ?? []);
    const live = bookings.filter((b) => b.status !== "cancelled");
    return {
      upcomingEvents: events
        .filter((e) => toDateInput(e.eventDate) >= today)
        .sort((a, b) => toDateInput(a.eventDate).localeCompare(toDateInput(b.eventDate))),
      upcomingShoots: bookings.filter((b) => b.status === "confirmed" && toDateInput(b.eventDate) >= today),
      enquiries: bookings
        .filter((b) => b.status === "enquiry")
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
      balanceDue: live.filter((b) => b.status !== "enquiry").reduce((sum, b) => sum + b.balance, 0),
      collected: live.reduce((sum, b) => sum + b.amountPaid, 0),
      photos: media.filter((m) => m.type === "image").length,
      videos: media.filter((m) => m.type === "video").length,
      mediaBytes: media.reduce((sum, m) => sum + (m.size || 0), 0),
      recentMedia: events
        .flatMap((e) => (e.mediaFiles ?? []).filter((m) => m.type !== "document").map((m) => ({ ...m, eventName: e.eventName, eventId: e._id })))
        .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
        .slice(0, 8),
    };
  }, [events, bookings]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const storageUsed = storage?.total.bytes ?? data.mediaBytes;
  const storageLimit = storage?.studioLimitBytes ?? null;
  const storagePct = usagePercent(storageUsed, storageLimit);
  const nothingToShow = !canEvents && !canBookings && !canStorage;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name?.split(" ")[0]}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · here&apos;s your studio today.
          </p>
        </div>
        <div className="flex gap-2 self-start">
          {can("bookings.manage") && (
            <Link href="/bookings" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
              <CalendarCheck className="h-4 w-4" /> Bookings
            </Link>
          )}
          {can("events.create") && (
            <Link href="/events" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700">
              <CalendarPlus className="h-4 w-4" /> New event
            </Link>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Some sections couldn&apos;t load: {errors.join(" · ")}
        </div>
      )}

      {nothingToShow && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          Your role doesn&apos;t include events, bookings or storage yet. Ask your studio admin if you need access.
        </div>
      )}

      {/* Key numbers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canBookings && (
          <>
            <StatCard
              label="Upcoming shoots"
              value={data.upcomingShoots.length}
              hint={`${data.enquiries.length} open enquir${data.enquiries.length === 1 ? "y" : "ies"}`}
              icon={CalendarCheck}
              tone="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
              href="/bookings"
            />
            <StatCard
              label="Balance due"
              value={formatMoney(data.balanceDue)}
              hint={`${formatMoney(data.collected)} collected`}
              icon={IndianRupee}
              tone="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
              href="/bookings"
            />
          </>
        )}
        {canEvents && (
          <StatCard
            label="Events"
            value={events.length}
            hint={`${data.photos} photos · ${data.videos} videos`}
            icon={CalendarDays}
            tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
            href="/events"
          />
        )}
        {(canStorage || canEvents) && (
          <StatCard
            label="Storage used"
            value={formatBytes(storageUsed)}
            hint={storageLimit ? `${Math.round(storagePct)}% of ${formatBytes(storageLimit)}` : "No limit set"}
            icon={HardDrive}
            tone="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
            href={canStorage ? "/storage" : "/events"}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Upcoming: bookings when available, otherwise events */}
        {canBookings ? (
          <Panel title="Upcoming shoots" href="/bookings" className="lg:col-span-3">
            {data.upcomingShoots.length === 0 ? (
              <Empty>No confirmed shoots coming up.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-zinc-900">
                {data.upcomingShoots.slice(0, 5).map((b) => {
                  const pay = paymentState(b);
                  return (
                    <li key={b._id}>
                      <Link href={b.eventId ? `/events/${b.eventId}` : "/bookings"} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-zinc-900/60">
                        <DateBadge value={b.eventDate} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{b.clientName}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-zinc-500">
                            {eventTypeLabel(b.eventType)}
                            {b.startTime && ` · ${formatTime(b.startTime)}`}
                            {b.eventPlace && ` · ${b.eventPlace}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">{formatMoney(b.packagePrice)}</p>
                          <p className={`text-[11px] font-medium ${pay.tone}`}>{b.balance > 0 && b.packagePrice > 0 ? `${formatMoney(b.balance)} due` : pay.label}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        ) : (
          canEvents && (
            <Panel title="Upcoming events" href="/events" className="lg:col-span-3">
              {data.upcomingEvents.length === 0 ? (
                <Empty>No upcoming events.</Empty>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-zinc-900">
                  {data.upcomingEvents.slice(0, 5).map((e) => (
                    <li key={e._id}>
                      <Link href={`/events/${e._id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-zinc-900/60">
                        <DateBadge value={e.eventDate} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{e.eventName}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-zinc-500"><MapPin className="h-3 w-3 shrink-0" /> {e.eventPlace}</p>
                        </div>
                        <span className="text-xs text-slate-400">{e.mediaFiles?.length ?? 0} files</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )
        )}

        {/* Storage */}
        {canStorage && storage && (
          <Panel title="Storage" href="/storage" linkLabel="Details" className="lg:col-span-2">
            <div className="space-y-4 p-4">
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-bold">{formatBytes(storage.total.bytes)}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{storageLimit ? `of ${formatBytes(storageLimit)}` : "no limit"}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  {storageLimit ? (
                    <div className={`h-full rounded-full ${usageTone(storagePct)}`} style={{ width: `${storagePct}%` }} />
                  ) : (
                    <div className="flex h-full">
                      <div className={MEDIA_COLORS.photos} style={{ width: `${storage.total.bytes ? (storage.total.photoBytes / storage.total.bytes) * 100 : 0}%` }} />
                      <div className={MEDIA_COLORS.videos} style={{ width: `${storage.total.bytes ? (storage.total.videoBytes / storage.total.bytes) * 100 : 0}%` }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-900">
                  <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400"><ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> Photos</p>
                  <p className="mt-1 font-semibold">{formatBytes(storage.total.photoBytes)}</p>
                  <p className="text-xs text-slate-400">{storage.total.photos} files</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-900">
                  <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400"><Video className="h-3.5 w-3.5 text-rose-500" /> Videos</p>
                  <p className="mt-1 font-semibold">{formatBytes(storage.total.videoBytes)}</p>
                  <p className="text-xs text-slate-400">{storage.total.videos} files</p>
                </div>
              </div>
              {storage.perEvent.filter((e) => e.bytes > 0).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Largest events</p>
                  <ul className="space-y-2">
                    {storage.perEvent.filter((e) => e.bytes > 0).slice(0, 3).map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                        <Link href={`/events/${e.id}`} className="truncate hover:text-blue-600 dark:hover:text-blue-400">{e.eventName}</Link>
                        <span className="shrink-0 text-slate-500 dark:text-zinc-400">{formatBytes(e.bytes)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* New enquiries */}
        {canBookings && (
          <Panel title="New enquiries" href="/bookings" className="lg:col-span-2">
            {data.enquiries.length === 0 ? (
              <Empty>No open enquiries.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-zinc-900">
                {data.enquiries.slice(0, 5).map((b) => (
                  <li key={b._id} className="flex items-center gap-3 px-4 py-3">
                    <span className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"><Inbox className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.clientName}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-zinc-500">
                        {bookingNumber(b)} · {eventTypeLabel(b.eventType)} · {formatEventDate(b.eventDate)} · {formatRelative(b.createdAt)}
                      </p>
                    </div>
                    <a href={`tel:${b.clientPhone}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-zinc-800" aria-label={`Call ${b.clientName}`}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {/* Recent uploads */}
        {canEvents && (
          <Panel title="Recent uploads" href="/events" className={canBookings ? "lg:col-span-3" : "lg:col-span-5"}>
            {data.recentMedia.length === 0 ? (
              <Empty>No photos uploaded yet. Open an event to upload photos and videos.</Empty>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                {data.recentMedia.map((m: MediaFile & { eventName: string; eventId: string }) => (
                  <Link key={m.publicId} href={`/events/${m.eventId}`} className="group overflow-hidden rounded-lg bg-slate-100 dark:bg-zinc-900">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUrl(m, 300)} alt={m.originalName} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      {m.type === "video" && <Video className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow" />}
                    </div>
                    <p className="truncate px-2 py-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {m.eventName} · {formatDate(m.uploadedAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
