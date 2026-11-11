"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  Columns3,
  Inbox,
  IndianRupee,
  Link2,
  List,
  Loader2,
  MapPin,
  Search,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Assignee,
  Booking,
  BookingStatus,
  bookingNumber,
  paymentState,
  QUICK_NEXT,
  STATUS_ACCENTS,
  STATUS_ORDER,
  STATUS_STYLES,
} from "@/lib/bookings";
import { eventTypeLabel, formatEventDate, formatTime, relativeDay, toDateInput, todayInput } from "@/lib/events";
import { formatMoney } from "@/lib/format";
import { initials } from "@/lib/team";
import BookingFormDialog from "@/components/bookings/BookingFormDialog";
import BookingPanel from "@/components/bookings/BookingPanel";
import { btn, inputClass } from "@/components/studio/Modal";
import RequirePermission from "@/components/studio/RequirePermission";

type View = "pipeline" | "list";
type StatusFilter = "all" | BookingStatus;

function Stat({ label, value, hint, icon: Icon, tone }: { label: string; value: string | number; hint: string; icon: React.ElementType; tone: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">{label}</p>
        <p className="truncate text-lg font-bold leading-tight">{value}</p>
        <p className="truncate text-xs text-slate-400 dark:text-zinc-500">{hint}</p>
      </div>
    </div>
  );
}

function Avatars({ people }: { people: Booking["assignedTo"] }) {
  if (people.length === 0) return null;
  return (
    <div className="flex -space-x-1.5">
      {people.slice(0, 3).map((p) => (
        <span key={p._id} title={p.name} className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[9px] font-semibold text-white ring-2 ring-white dark:bg-zinc-600 dark:ring-zinc-950">
          {initials(p.name)}
        </span>
      ))}
      {people.length > 3 && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[9px] font-semibold ring-2 ring-white dark:bg-zinc-800 dark:ring-zinc-950">
          +{people.length - 3}
        </span>
      )}
    </div>
  );
}

function BookingCard({ booking, onOpen, onQuickMove, moving }: {
  booking: Booking;
  onOpen: () => void;
  onQuickMove?: (to: BookingStatus) => void;
  moving: boolean;
}) {
  const pay = paymentState(booking);
  const accent = STATUS_ACCENTS[booking.status];
  const quick = onQuickMove ? QUICK_NEXT[booking.status] : undefined;
  const overdue = toDateInput(booking.eventDate) < todayInput() && booking.status !== "completed" && booking.status !== "cancelled";
  const paidPct = booking.packagePrice > 0 ? Math.min((booking.amountPaid / booking.packagePrice) * 100, 100) : 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 before:absolute before:inset-y-0 before:left-0 before:w-1 ${accent.edge}`}
    >
      <button onClick={onOpen} className="block w-full p-3 pl-4 text-left">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white ${accent.avatar}`}>
            {initials(booking.clientName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{booking.clientName}</p>
            <p className="truncate text-[11px] text-slate-500 dark:text-zinc-400">
              {eventTypeLabel(booking.eventType)} · <span className="font-mono">{bookingNumber(booking)}</span>
            </p>
          </div>
          {booking.eventId && <Link2 className="h-3.5 w-3.5 shrink-0 text-blue-500" aria-label="Event created" />}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-slate-600 dark:text-zinc-300">
            {formatEventDate(booking.eventDate, { weekday: "short", year: undefined })}
            {booking.startTime && ` · ${formatTime(booking.startTime)}`}
          </span>
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${overdue ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>
            {relativeDay(booking.eventDate)}
          </span>
        </div>
        {booking.eventPlace && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-400 dark:text-zinc-500">
            <MapPin className="h-3 w-3 shrink-0" /> {booking.eventPlace}
          </p>
        )}

        {booking.packagePrice > 0 && (
          <div className="mt-2.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold">{formatMoney(booking.packagePrice)}</span>
              <span className={`font-medium ${pay.tone}`}>{booking.balance > 0 ? `${formatMoney(booking.balance)} due` : pay.label}</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidPct}%` }} />
            </div>
          </div>
        )}
      </button>

      {(booking.assignedTo.length > 0 || quick) && (
        <div className="flex items-center justify-between border-t border-slate-100 px-3 py-1.5 pl-4 dark:border-zinc-900">
          <Avatars people={booking.assignedTo} />
          {quick && (
            <button
              onClick={() => onQuickMove!(quick.to)}
              disabled={moving}
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-blue-600 opacity-80 transition hover:bg-blue-50 hover:opacity-100 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
            >
              {moving ? <Loader2 className="h-3 w-3 animate-spin" /> : null} {quick.label} <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingsPageWithAccess() {
  return (
    <RequirePermission permission="bookings.view">
      <BookingsPage />
    </RequirePermission>
  );
}

function BookingsPage() {
  const { can } = useAuth();
  const canManage = can("bookings.manage");
  const canCreateEvent = can("events.create");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [team, setTeam] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<View>("pipeline");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; booking: Booking | null }>({ open: false, booking: null });

  const load = useCallback(async () => {
    try {
      const [b, t] = await Promise.all([
        api<{ bookings: Booking[] }>("/bookings"),
        api<{ users: Assignee[] }>("/bookings/team"),
      ]);
      setBookings(b.bookings);
      setTeam(t.users);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    try {
      const saved = localStorage.getItem("bookings-view");
      if (saved === "pipeline" || saved === "list") setView(saved);
    } catch {}
  }, [load]);

  const changeView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem("bookings-view", next);
    } catch {}
  };

  const upsert = (booking: Booking) =>
    setBookings((prev) => {
      const exists = prev.some((b) => b._id === booking._id);
      const next = exists ? prev.map((b) => (b._id === booking._id ? booking : b)) : [...prev, booking];
      return next.sort((a, b) => toDateInput(a.eventDate).localeCompare(toDateInput(b.eventDate)));
    });

  const quickMove = async (booking: Booking, to: BookingStatus) => {
    setMovingId(booking._id);
    try {
      const data = await api<{ booking: Booking }>(`/bookings/${booking._id}/status`, { method: "PUT", body: { status: to } });
      upsert(data.booking);
      toast.success(`${booking.clientName} → ${STATUS_STYLES[to].label}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setMovingId(null);
    }
  };

  const stats = useMemo(() => {
    const today = todayInput();
    const active = bookings.filter((b) => b.status !== "cancelled");
    const booked = active.filter((b) => b.status === "confirmed" || b.status === "completed");
    return {
      enquiries: bookings.filter((b) => b.status === "enquiry").length,
      upcoming: bookings.filter((b) => b.status === "confirmed" && toDateInput(b.eventDate) >= today).length,
      bookedValue: booked.reduce((sum, b) => sum + b.packagePrice, 0),
      collected: active.reduce((sum, b) => sum + b.amountPaid, 0),
      outstanding: booked.reduce((sum, b) => sum + b.balance, 0),
    };
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter(
      (b) =>
        !q ||
        [b.clientName, b.clientPhone, b.clientEmail, b.eventPlace, b.packageName, bookingNumber(b)].some((v) => v?.toLowerCase().includes(q))
    );
  }, [bookings, search]);

  const openBooking = bookings.find((b) => b._id === openId) ?? null;
  const columns = STATUS_ORDER.filter((s) => s !== "cancelled" || showCancelled);
  const listRows = filtered.filter((b) => statusFilter === "all" || b.status === statusFilter);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bookings</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            {canManage ? "Enquiries, payments and who's shooting what." : "Bookings you're assigned to."}
          </p>
        </div>
        {canManage && (
          <button className={`${btn.primary} self-start`} onClick={() => setForm({ open: true, booking: null })}>
            <CalendarPlus className="h-4 w-4" /> New booking
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 lg:grid-cols-4 lg:divide-x">
        <Stat label="Enquiries" value={stats.enquiries} hint="Waiting to confirm" icon={Inbox} tone="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" />
        <Stat label="Upcoming" value={stats.upcoming} hint="Confirmed shoots" icon={CalendarCheck} tone="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" />
        <Stat label="Collected" value={formatMoney(stats.collected)} hint={`of ${formatMoney(stats.bookedValue)} booked`} icon={Wallet} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" />
        <Stat label="Balance due" value={formatMoney(stats.outstanding)} hint="To collect" icon={IndianRupee} tone="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputClass} py-2 pl-9`} placeholder="Search client, phone, venue, package or BK number" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          {view === "pipeline" ? (
            <label className="flex shrink-0 items-center gap-2 rounded-lg px-2 text-sm text-slate-600 dark:text-zinc-300">
              <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
              Cancelled
            </label>
          ) : (
            <select className={`${inputClass} py-2 sm:w-40`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} aria-label="Status">
              <option value="all">All statuses</option>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
            </select>
          )}
          <div className="flex shrink-0 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-900">
            {([
              { key: "pipeline", icon: Columns3, label: "Board" },
              { key: "list", icon: List, label: "List" },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => changeView(key)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium ${
                  view === key ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <div className="rounded-full bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"><CalendarCheck className="h-6 w-6" /></div>
          <h3 className="mt-4 font-semibold">{canManage ? "Add your first booking" : "No bookings assigned to you yet"}</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-zinc-400">
            {canManage ? "Log enquiries as they come in, record advances, and turn confirmed bookings into events." : "When a manager assigns you to a booking it shows up here."}
          </p>
          {canManage && (
            <button className={`${btn.primary} mt-3.5`} onClick={() => setForm({ open: true, booking: null })}>
              <CalendarPlus className="h-4 w-4" /> New booking
            </button>
          )}
        </div>
      ) : view === "pipeline" ? (
        <div className={`grid gap-3 ${columns.length === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}>
          {columns.map((status) => {
            const items = filtered.filter((b) => b.status === status);
            const style = STATUS_STYLES[status];
            const total = items.reduce((sum, b) => sum + b.packagePrice, 0);
            return (
              <div key={status} className={`flex flex-col rounded-2xl border-t-[3px] bg-slate-100/70 p-2 dark:bg-zinc-900/50 ${STATUS_ACCENTS[status].header}`}>
                <div className="mb-2 flex items-center justify-between px-1.5 pt-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {style.label}
                    <span className="rounded-full bg-white px-1.5 text-[11px] font-medium text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">{items.length}</span>
                  </span>
                  {total > 0 && <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">{formatMoney(total)}</span>}
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 px-3 py-3.5 text-center text-xs text-slate-400 dark:border-zinc-800">Nothing here</p>
                  ) : (
                    items.map((b) => (
                      <BookingCard
                        key={b._id}
                        booking={b}
                        onOpen={() => setOpenId(b._id)}
                        onQuickMove={canManage ? (to) => quickMove(b, to) : undefined}
                        moving={movingId === b._id}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400 dark:border-zinc-900 dark:text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Client</th>
                <th className="px-4 py-2.5 font-semibold">Event date</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Payment</th>
                <th className="px-4 py-2.5 font-semibold">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
              {listRows.map((b) => {
                const style = STATUS_STYLES[b.status];
                const pay = paymentState(b);
                const paidPct = b.packagePrice > 0 ? Math.min((b.amountPaid / b.packagePrice) * 100, 100) : 0;
                return (
                  <tr key={b._id} onClick={() => setOpenId(b._id)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/60">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white ${STATUS_ACCENTS[b.status].avatar}`}>
                          {initials(b.clientName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{b.clientName}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-zinc-500">
                            <span className="font-mono">{bookingNumber(b)}</span> · {eventTypeLabel(b.eventType)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {formatEventDate(b.eventDate)}
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{relativeDay(b.eventDate)}</p>
                    </td>
                    <td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.tone}`}>{style.label}</span></td>
                    <td className="w-48 px-4 py-2.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-semibold">{formatMoney(b.packagePrice)}</span>
                        <span className={`font-medium ${pay.tone}`}>{b.balance > 0 && b.packagePrice > 0 ? `${formatMoney(b.balance)} due` : pay.label}</span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidPct}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><Avatars people={b.assignedTo} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {listRows.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-zinc-400">No bookings match.</p>}
        </div>
      )}

      <BookingPanel
        booking={openBooking}
        onClose={() => setOpenId(null)}
        canManage={canManage}
        canCreateEvent={canCreateEvent}
        onChanged={upsert}
        onDeleted={(id) => {
          setOpenId(null);
          setBookings((prev) => prev.filter((b) => b._id !== id));
        }}
        onEdit={(b) => setForm({ open: true, booking: b })}
      />

      <BookingFormDialog
        open={form.open}
        booking={form.booking}
        team={team}
        onClose={() => setForm({ open: false, booking: null })}
        onSaved={(b) => {
          upsert(b);
          if (!form.booking) setOpenId(b._id);
        }}
      />
    </div>
  );
}
