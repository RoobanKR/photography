"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { Assignee, Booking, BookingSource, METHOD_LABELS, PaymentMethod, SOURCE_LABELS } from "@/lib/bookings";
import { EVENT_TYPES, EventTypeKey, toDateInput } from "@/lib/events";
import { formatMoney } from "@/lib/format";
import { initials } from "@/lib/team";
import Modal, { btn, inputClass } from "@/components/studio/Modal";

interface BookingFormDialogProps {
  open: boolean;
  onClose: () => void;
  booking?: Booking | null; // edit mode when set
  team: Assignee[];
  onSaved: (booking: Booking) => void;
}

interface Values {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  source: BookingSource;
  eventType: EventTypeKey;
  eventDate: string;
  startTime: string;
  eventPlace: string;
  packageName: string;
  packagePrice: string;
  advanceAmount: string;
  advanceMethod: PaymentMethod;
  assignedTo: string[];
  notes: string;
}

const EMPTY: Values = {
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  source: "phone",
  eventType: "wedding",
  eventDate: "",
  startTime: "",
  eventPlace: "",
  packageName: "",
  packagePrice: "",
  advanceAmount: "",
  advanceMethod: "upi",
  assignedTo: [],
  notes: "",
};

const fromBooking = (b: Booking): Values => ({
  clientName: b.clientName,
  clientPhone: b.clientPhone,
  clientEmail: b.clientEmail,
  source: b.source,
  eventType: b.eventType,
  eventDate: toDateInput(b.eventDate),
  startTime: b.startTime,
  eventPlace: b.eventPlace,
  packageName: b.packageName,
  packagePrice: b.packagePrice ? String(b.packagePrice) : "",
  advanceAmount: "",
  advanceMethod: "upi",
  assignedTo: b.assignedTo.map((a) => a._id),
  notes: b.notes,
});

type Errors = Partial<Record<keyof Values, string>>;

function Field({ label, required, error, children, className = "" }: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="block text-xs font-medium text-red-500">{error}</span>}
    </label>
  );
}

const Legend = ({ children }: { children: React.ReactNode }) => (
  <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{children}</legend>
);

export default function BookingFormDialog({ open, onClose, booking, team, onSaved }: BookingFormDialogProps) {
  const isEdit = Boolean(booking);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(booking ? fromBooking(booking) : EMPTY);
      setErrors({});
    }
  }, [open, booking]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleAssignee = (id: string) =>
    set("assignedTo", values.assignedTo.includes(id) ? values.assignedTo.filter((a) => a !== id) : [...values.assignedTo, id]);

  const price = Number(values.packagePrice || 0);
  const advance = Number(values.advanceAmount || 0);

  const validate = () => {
    const e: Errors = {};
    if (!values.clientName.trim()) e.clientName = "Client name is required";
    if (!values.clientPhone.trim()) e.clientPhone = "Phone is required";
    else if (!/^[+\d][\d\s-]{6,}$/.test(values.clientPhone)) e.clientPhone = "Enter a valid phone number";
    if (values.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.clientEmail)) e.clientEmail = "Enter a valid email";
    if (!values.eventDate) e.eventDate = "Event date is required";
    if (values.packagePrice && (isNaN(price) || price < 0)) e.packagePrice = "Enter a valid amount";
    if (isEdit && booking && price < booking.amountPaid) e.packagePrice = `Can't be less than ${formatMoney(booking.amountPaid)} already paid`;
    if (!isEdit && values.advanceAmount) {
      if (isNaN(advance) || advance < 0) e.advanceAmount = "Enter a valid amount";
      else if (price > 0 && advance > price) e.advanceAmount = "More than the package price";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const { advanceAmount, advanceMethod, ...rest } = values;
      const body = { ...rest, packagePrice: price, ...(isEdit ? {} : { advanceAmount: advance, advanceMethod }) };
      const data = isEdit
        ? await api<{ booking: Booking }>(`/bookings/${booking!._id}`, { method: "PUT", body })
        : await api<{ booking: Booking }>("/bookings", { method: "POST", body });
      toast.success(isEdit ? "Booking updated" : advance > 0 ? "Booking confirmed with advance" : "Enquiry added");
      onSaved(data.booking);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      size="lg"
      title={isEdit ? "Edit booking" : "New booking"}
      description={isEdit ? "Update the client, event or package." : "Add an enquiry. Recording an advance confirms it straight away."}
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="booking-form" className={btn.primary} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add booking"}
          </button>
        </>
      }
    >
      <form id="booking-form" onSubmit={handleSubmit} noValidate className="space-y-7">
        <fieldset className="space-y-4">
          <Legend>Client</Legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client name" required error={errors.clientName}>
              <input className={inputClass} value={values.clientName} onChange={(e) => set("clientName", e.target.value)} autoFocus />
            </Field>
            <Field label="Phone" required error={errors.clientPhone}>
              <input type="tel" className={inputClass} value={values.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Email" error={errors.clientEmail}>
              <input type="email" className={inputClass} value={values.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} placeholder="client@email.com" />
            </Field>
            <Field label="How they found you">
              <select className={inputClass} value={values.source} onChange={(e) => set("source", e.target.value as BookingSource)}>
                {Object.entries(SOURCE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <Legend>Event</Legend>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Event type" className="sm:col-span-2">
              <select className={inputClass} value={values.eventType} onChange={(e) => set("eventType", e.target.value as EventTypeKey)}>
                {Object.entries(EVENT_TYPES).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Field>
            <Field label="Date" required error={errors.eventDate}>
              <input type="date" className={inputClass} value={values.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
            </Field>
            <Field label="Start time">
              <input type="time" className={inputClass} value={values.startTime} onChange={(e) => set("startTime", e.target.value)} />
            </Field>
          </div>
          <Field label="Venue">
            <input className={inputClass} value={values.eventPlace} onChange={(e) => set("eventPlace", e.target.value)} placeholder="Hall name, city" />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <Legend>Package &amp; payment</Legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Package">
              <input className={inputClass} value={values.packageName} onChange={(e) => set("packageName", e.target.value)} placeholder="e.g. Gold — 2 photographers + video" />
            </Field>
            <Field label="Package price (₹)" error={errors.packagePrice}>
              <input type="number" min="0" step="500" className={inputClass} value={values.packagePrice} onChange={(e) => set("packagePrice", e.target.value)} placeholder="0" />
            </Field>
          </div>
          {!isEdit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Advance received (₹)" error={errors.advanceAmount}>
                <input type="number" min="0" step="500" className={inputClass} value={values.advanceAmount} onChange={(e) => set("advanceAmount", e.target.value)} placeholder="Leave empty for an enquiry" />
              </Field>
              <Field label="Paid by">
                <select className={inputClass} value={values.advanceMethod} onChange={(e) => set("advanceMethod", e.target.value as PaymentMethod)} disabled={!advance}>
                  {Object.entries(METHOD_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </Field>
            </div>
          )}
          {price > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-slate-50 px-4 py-3 text-sm dark:bg-zinc-900">
              <span>Price <strong>{formatMoney(price)}</strong></span>
              <span>Paid <strong>{formatMoney(isEdit ? booking!.amountPaid : advance)}</strong></span>
              <span>Balance <strong>{formatMoney(Math.max(price - (isEdit ? booking!.amountPaid : advance), 0))}</strong></span>
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <Legend>Team</Legend>
          {team.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-zinc-400">Add photographers in Users &amp; Roles to assign them here.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {team.map((member) => {
                const selected = values.assignedTo.includes(member.id);
                return (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => toggleAssignee(member.id)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors ${
                      selected
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : "border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ${selected ? "bg-blue-600" : "bg-slate-400 dark:bg-zinc-600"}`}>
                      {selected ? <Check className="h-3.5 w-3.5" /> : initials(member.name)}
                    </span>
                    {member.name}
                    <span className="text-xs text-slate-400">{member.roleName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        <Field label="Notes">
          <textarea rows={3} className={`${inputClass} resize-none`} value={values.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Requirements, shot list, follow-up reminders…" />
        </Field>
      </form>
    </Modal>
  );
}
