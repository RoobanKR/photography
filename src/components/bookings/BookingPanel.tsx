"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CalendarPlus,
  ExternalLink,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import {
  Booking,
  BookingStatus,
  bookingNumber,
  METHOD_LABELS,
  NEXT_STATUSES,
  PaymentMethod,
  paymentState,
  SOURCE_LABELS,
  STATUS_ACCENTS,
  STATUS_ACTION_LABELS,
  STATUS_STYLES,
} from "@/lib/bookings";
import { eventTypeLabel, formatEventDate, formatTime, todayInput } from "@/lib/events";
import { formatDate, formatMoney } from "@/lib/format";
import { initials } from "@/lib/team";
import ConfirmDialog from "@/components/studio/ConfirmDialog";
import { btn, inputClass } from "@/components/studio/Modal";

interface BookingPanelProps {
  booking: Booking | null;
  onClose: () => void;
  canManage: boolean;
  canCreateEvent: boolean;
  onChanged: (booking: Booking) => void;
  onDeleted: (id: string) => void;
  onEdit: (booking: Booking) => void;
}

// WhatsApp links need digits only, with the country code
const whatsappLink = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
};

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-slate-100 px-4 py-3.5 dark:border-zinc-900">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h3>
      {children}
    </section>
  );
}

export default function BookingPanel({ booking, onClose, canManage, canCreateEvent, onChanged, onDeleted, onEdit }: BookingPanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payment, setPayment] = useState({ amount: "", method: "upi" as PaymentMethod, paidAt: todayInput(), note: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset the inline forms when another booking is opened
  useEffect(() => {
    setCancelling(false);
    setCancelReason("");
    setPaymentOpen(false);
  }, [booking?._id]);

  useEffect(() => {
    if (!booking) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !confirmDelete && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [booking, onClose, confirmDelete]);

  const run = async (key: string, action: () => Promise<{ booking: Booking }>, success: string) => {
    setBusy(key);
    try {
      const data = await action();
      onChanged(data.booking);
      toast.success(success);
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const changeStatus = (status: BookingStatus) =>
    run(
      `status-${status}`,
      () => api(`/bookings/${booking!._id}/status`, { method: "PUT", body: { status, cancelReason } }),
      `Booking ${STATUS_STYLES[status].label.toLowerCase()}`
    ).then((ok) => ok && setCancelling(false));

  const openPaymentForm = () => {
    setPayment({ amount: booking!.balance > 0 ? String(booking!.balance) : "", method: "upi", paidAt: todayInput(), note: "" });
    setPaymentOpen(true);
  };

  const addPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await run(
      "payment",
      () => api(`/bookings/${booking!._id}/payments`, { method: "POST", body: { ...payment, amount: Number(payment.amount) } }),
      "Payment recorded"
    );
    if (ok) setPaymentOpen(false);
  };

  const removePayment = (paymentId: string) =>
    run(`remove-${paymentId}`, () => api(`/bookings/${booking!._id}/payments/${paymentId}`, { method: "DELETE" }), "Payment removed");

  const createEvent = () =>
    run("convert", () => api(`/bookings/${booking!._id}/convert`, { method: "POST", body: {} }), "Event created. Upload photos from the event page.");

  const deleteBooking = async () => {
    setBusy("delete");
    try {
      await api(`/bookings/${booking!._id}`, { method: "DELETE" });
      toast.success("Booking deleted");
      setConfirmDelete(false);
      onDeleted(booking!._id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const status = booking ? STATUS_STYLES[booking.status] : null;
  const pay = booking ? paymentState(booking) : null;
  const paidPercent = booking && booking.packagePrice > 0 ? Math.min((booking.amountPaid / booking.packagePrice) * 100, 100) : 0;

  return (
    <AnimatePresence>
      {booking && status && pay && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label={`Booking ${bookingNumber(booking)}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-zinc-950"
          >
            {/* Header */}
            <div className={`border-t-4 px-4 pb-5 pt-5 ${STATUS_ACCENTS[booking.status].header}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-400">{bookingNumber(booking)}</span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${status.tone}`}>{status.label}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${STATUS_ACCENTS[booking.status].avatar}`}>
                      {initials(booking.clientName)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-bold">{booking.clientName}</h2>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">
                        {eventTypeLabel(booking.eventType)} · {formatEventDate(booking.eventDate, { weekday: "short" })}
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {canManage && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {NEXT_STATUSES[booking.status].map((next) =>
                      next === "cancelled" ? (
                        <button key={next} className={`${btn.secondary} text-red-600 dark:text-red-400`} onClick={() => setCancelling(true)} disabled={busy !== null}>
                          {STATUS_ACTION_LABELS[next]}
                        </button>
                      ) : (
                        <button
                          key={next}
                          className={next === "confirmed" || next === "completed" ? btn.primary : btn.secondary}
                          onClick={() => changeStatus(next)}
                          disabled={busy !== null}
                        >
                          {busy === `status-${next}` && <Loader2 className="h-4 w-4 animate-spin" />}
                          {booking.status === "cancelled" && next === "enquiry" ? "Reopen booking" : STATUS_ACTION_LABELS[next]}
                        </button>
                      )
                    )}
                  </div>
                  {cancelling && (
                    <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                      <input
                        className={inputClass}
                        placeholder="Reason (optional), e.g. date changed, went with another studio"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button className={btn.ghost} onClick={() => setCancelling(false)}>Keep booking</button>
                        <button className={btn.danger} onClick={() => changeStatus("cancelled")} disabled={busy !== null}>
                          {busy === "status-cancelled" && <Loader2 className="h-4 w-4 animate-spin" />} Cancel booking
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {booking.status === "cancelled" && booking.cancelReason && (
                <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                  Cancelled: {booking.cancelReason}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Event */}
              <Section title="Event" icon={CalendarDays}>
                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {formatEventDate(booking.eventDate, { weekday: "long" })}
                    {booking.startTime && ` · ${formatTime(booking.startTime)}`}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" /> {booking.eventPlace || <span className="text-slate-400">No venue yet</span>}
                  </p>
                </div>
                {booking.eventId ? (
                  <Link href={`/events/${booking.eventId}`} className={`${btn.secondary} w-full`}>
                    <ExternalLink className="h-4 w-4" /> Open event &amp; gallery
                  </Link>
                ) : (
                  canManage &&
                  canCreateEvent &&
                  booking.status !== "cancelled" && (
                    <div>
                      <button className={`${btn.primary} w-full`} onClick={createEvent} disabled={busy !== null || !booking.eventPlace}>
                        {busy === "convert" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                        Create event from booking
                      </button>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                        {booking.eventPlace
                          ? "Copies the client and event details into a new event with a QR code."
                          : "Add the venue first (Edit booking)."}
                      </p>
                    </div>
                  )
                )}
              </Section>

              {/* Payment */}
              <Section title="Package & payment" icon={IndianRupee}>
                {booking.packageName && <p className="text-sm font-medium">{booking.packageName}</p>}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Price", value: booking.packagePrice },
                    { label: "Paid", value: booking.amountPaid },
                    { label: "Balance", value: booking.balance },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-slate-50 px-2 py-2.5 dark:bg-zinc-900">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">{item.label}</p>
                      <p className="mt-0.5 font-semibold">{formatMoney(item.value)}</p>
                    </div>
                  ))}
                </div>
                {booking.packagePrice > 0 && (
                  <div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidPercent}%` }} />
                    </div>
                    <p className={`mt-1 text-xs font-medium ${pay.tone}`}>{pay.label}</p>
                  </div>
                )}

                {booking.payments.length > 0 && (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-zinc-900 dark:border-zinc-800">
                    {booking.payments.map((p) => (
                      <li key={p._id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{formatMoney(p.amount)}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                            {formatDate(p.paidAt)} · {METHOD_LABELS[p.method]}{p.note && ` · ${p.note}`}
                          </p>
                        </div>
                        {canManage && (
                          <button
                            onClick={() => removePayment(p._id)}
                            disabled={busy !== null}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                            aria-label="Remove payment"
                          >
                            {busy === `remove-${p._id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {canManage && booking.status !== "cancelled" && (booking.packagePrice === 0 || booking.balance > 0) &&
                  (paymentOpen ? (
                    <form onSubmit={addPayment} className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-zinc-800">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="1"
                          className={inputClass}
                          placeholder="Amount (₹)"
                          value={payment.amount}
                          onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                          autoFocus
                          required
                        />
                        <select className={inputClass} value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value as PaymentMethod })}>
                          {Object.entries(METHOD_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                        <input type="date" className={inputClass} value={payment.paidAt} max={todayInput()} onChange={(e) => setPayment({ ...payment, paidAt: e.target.value })} />
                        <input className={inputClass} placeholder="Note (optional)" value={payment.note} onChange={(e) => setPayment({ ...payment, note: e.target.value })} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" className={btn.ghost} onClick={() => setPaymentOpen(false)}>Cancel</button>
                        <button type="submit" className={btn.primary} disabled={busy !== null}>
                          {busy === "payment" && <Loader2 className="h-4 w-4 animate-spin" />} Save payment
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button className={`${btn.secondary} w-full`} onClick={openPaymentForm}>
                      <Plus className="h-4 w-4" /> Record payment
                    </button>
                  ))}
              </Section>

              {/* Client */}
              <Section title="Client" icon={Phone}>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a href={`tel:${booking.clientPhone}`} className="text-blue-600 hover:underline dark:text-blue-400">{booking.clientPhone}</a>
                    <a
                      href={whatsappLink(booking.clientPhone)}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </div>
                  {booking.clientEmail && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a href={`mailto:${booking.clientEmail}`} className="break-all text-blue-600 hover:underline dark:text-blue-400">{booking.clientEmail}</a>
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Found you via {SOURCE_LABELS[booking.source]}</p>
                </div>
              </Section>

              {/* Team */}
              <Section title="Team" icon={Users}>
                {booking.assignedTo.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-zinc-400">No one assigned yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {booking.assignedTo.map((m) => (
                      <span key={m._id} className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-sm dark:bg-zinc-900">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">{initials(m.name)}</span>
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}
              </Section>

              {booking.notes && (
                <Section title="Notes" icon={Pencil}>
                  <p className="whitespace-pre-line text-sm text-slate-600 dark:text-zinc-300">{booking.notes}</p>
                </Section>
              )}

              <p className="px-4 pb-6 text-xs text-slate-400">Added {formatDate(booking.createdAt)}</p>
            </div>

            {canManage && (
              <div className="flex gap-2 border-t border-slate-100 px-4 py-4 dark:border-zinc-900">
                <button className={`${btn.secondary} flex-1`} onClick={() => onEdit(booking)}>
                  <Pencil className="h-4 w-4" /> Edit booking
                </button>
                <button
                  className={`${btn.secondary} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40`}
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete booking"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.aside>

          <ConfirmDialog
            open={confirmDelete}
            busy={busy === "delete"}
            onClose={() => setConfirmDelete(false)}
            onConfirm={deleteBooking}
            title={`Delete ${bookingNumber(booking)}?`}
            message={
              <>
                The booking for <strong>{booking.clientName}</strong> and its {booking.payments.length} payment record(s) will be deleted.
                {booking.eventId && " The linked event and its photos are kept."} This can&apos;t be undone.
              </>
            }
          />
        </div>
      )}
    </AnimatePresence>
  );
}
