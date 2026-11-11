"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import {
  EVENT_TYPES,
  EventFormValues,
  EventTypeKey,
  StudioEvent,
  toDateInput,
  todayInput,
} from "@/lib/events";
import Modal, { btn, inputClass } from "./Modal";

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  event?: StudioEvent | null; // edit mode when set
  onSaved: (event: StudioEvent) => void;
}

const EMPTY: EventFormValues = {
  eventName: "",
  eventType: "wedding",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  eventDate: "",
  startTime: "",
  eventPlace: "",
  expiryDate: "",
  description: "",
};

// Default gallery expiry: 30 days after the event
const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const fromEvent = (event: StudioEvent): EventFormValues => ({
  eventName: event.eventName ?? "",
  eventType: (event.eventType as EventTypeKey) ?? "other",
  clientName: event.clientName ?? "",
  clientPhone: event.clientPhone ?? "",
  clientEmail: event.clientEmail ?? "",
  eventDate: toDateInput(event.eventDate),
  startTime: event.startTime ?? "",
  eventPlace: event.eventPlace ?? "",
  expiryDate: toDateInput(event.expiryDate),
  description: event.description ?? "",
});

type Errors = Partial<Record<keyof EventFormValues, string>>;

function Field({ label, required, error, hint, children }: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs font-medium text-red-500">{error}</span>
      ) : (
        hint && <span className="block text-xs text-slate-400 dark:text-zinc-500">{hint}</span>
      )}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function EventFormDialog({ open, onClose, event, onSaved }: EventFormDialogProps) {
  const [values, setValues] = useState<EventFormValues>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(event);
  const originalDate = event ? toDateInput(event.eventDate) : "";

  useEffect(() => {
    if (open) {
      setValues(event ? fromEvent(event) : EMPTY);
      setErrors({});
    }
  }, [open, event]);

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // Suggest an expiry date the first time a new event's date is picked
      if (key === "eventDate" && value && !prev.expiryDate && !isEdit) {
        next.expiryDate = addDays(value as string, 30);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e: Errors = {};
    const today = todayInput();
    if (!values.eventName.trim()) e.eventName = "Event name is required";
    if (!values.clientName.trim()) e.clientName = "Client name is required";
    if (!values.eventPlace.trim()) e.eventPlace = "Venue is required";
    if (!values.eventDate) e.eventDate = "Event date is required";
    else if (values.eventDate < today && values.eventDate !== originalDate) e.eventDate = "Event date cannot be in the past";
    if (!values.expiryDate) e.expiryDate = "Gallery expiry is required";
    else if (values.eventDate && values.expiryDate < values.eventDate) e.expiryDate = "Must be on or after the event date";
    if (values.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.clientEmail)) e.clientEmail = "Enter a valid email";
    if (values.clientPhone && !/^[+\d][\d\s-]{6,}$/.test(values.clientPhone)) e.clientPhone = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const data = isEdit
        ? await api<{ event: StudioEvent }>(`/events/${event!._id}`, { method: "PUT", body: values })
        : await api<{ event: StudioEvent }>("/events/create", { method: "POST", body: values });
      toast.success(isEdit ? "Event updated" : "Event created");
      onSaved(data.event);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const minEventDate = originalDate && originalDate < todayInput() ? originalDate : todayInput();

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      size="lg"
      title={isEdit ? "Edit event" : "New event"}
      description={isEdit ? "Update the event and client details." : "Add the event and client details. You can upload photos next."}
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="event-form" className={btn.primary} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create event"}
          </button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} noValidate className="space-y-7">
        <Section title="Event">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Event name" required error={errors.eventName}>
                <input
                  className={inputClass}
                  value={values.eventName}
                  onChange={(e) => set("eventName", e.target.value)}
                  placeholder="e.g. Priya & Arjun Wedding"
                  autoFocus
                />
              </Field>
            </div>
            <Field label="Event type" required>
              <select
                className={inputClass}
                value={values.eventType}
                onChange={(e) => set("eventType", e.target.value as EventTypeKey)}
              >
                {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Event date" required error={errors.eventDate}>
              <input
                type="date"
                className={inputClass}
                value={values.eventDate}
                min={minEventDate}
                onChange={(e) => set("eventDate", e.target.value)}
              />
            </Field>
            <Field label="Start time">
              <input
                type="time"
                className={inputClass}
                value={values.startTime}
                onChange={(e) => set("startTime", e.target.value)}
              />
            </Field>
            <Field label="Venue" required error={errors.eventPlace}>
              <input
                className={inputClass}
                value={values.eventPlace}
                onChange={(e) => set("eventPlace", e.target.value)}
                placeholder="Hall name, city"
              />
            </Field>
          </div>
        </Section>

        <Section title="Client">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Client name" required error={errors.clientName}>
              <input
                className={inputClass}
                value={values.clientName}
                onChange={(e) => set("clientName", e.target.value)}
                placeholder="Full name"
              />
            </Field>
            <Field label="Phone" error={errors.clientPhone}>
              <input
                type="tel"
                className={inputClass}
                value={values.clientPhone}
                onChange={(e) => set("clientPhone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </Field>
            <Field label="Email" error={errors.clientEmail}>
              <input
                type="email"
                className={inputClass}
                value={values.clientEmail}
                onChange={(e) => set("clientEmail", e.target.value)}
                placeholder="client@email.com"
              />
            </Field>
          </div>
        </Section>

        <Section title="Gallery">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Gallery expiry"
              required
              error={errors.expiryDate}
              hint="The guest gallery closes after this day"
            >
              <input
                type="date"
                className={inputClass}
                value={values.expiryDate}
                min={values.eventDate || minEventDate}
                onChange={(e) => set("expiryDate", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea
                  rows={3}
                  className={`${inputClass} resize-none`}
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Package, shot list, special requests…"
                />
              </Field>
            </div>
          </div>
        </Section>
      </form>
    </Modal>
  );
}
