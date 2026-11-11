// Types and period presets for the Analytics page (data from GET /api/analytics)

import type { BookingSource, BookingStatus, PaymentMethod } from "./bookings";

export interface MonthRow {
  month: string; // "2026-03"
  booked: number;
  collected: number;
  bookings: number;
  events: number;
  uploadedBytes: number;
}

export interface ClientBooking {
  id: string;
  number: number;
  status: BookingStatus;
  eventType: string;
  eventDate: string;
  packageName: string;
  packagePrice: number;
  paid: number;
  balance: number;
}

export interface ClientEvent {
  id: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  photos: number;
  videos: number;
  bytes: number;
}

export interface ClientRow {
  key: string;
  name: string;
  phone: string;
  email: string;
  bookings: ClientBooking[];
  events: ClientEvent[];
  value: number;
  paid: number;
  balance: number;
  photos: number;
  videos: number;
  bytes: number;
  lastDate: string | null;
}

export interface AnalyticsReport {
  range: { from: string; to: string };
  totals: {
    bookedValue: number;
    collected: number;
    outstanding: number;
    averageBooking: number;
    bookings: number;
    bookedCount: number;
    byStatus: Record<BookingStatus, number>;
    conversionRate: number;
    events: number;
    clients: number;
  };
  storage: {
    bytes: number;
    photos: number;
    videos: number;
    photoBytes: number;
    videoBytes: number;
    uploadedInPeriod: number;
    limitBytes: number | null;
  };
  monthly: MonthRow[];
  byEventType: { type: string; bookings: number; value: number }[];
  bySource: { source: BookingSource; bookings: number; value: number }[];
  byPaymentMethod: { method: PaymentMethod; amount: number }[];
  storageByEvent: (ClientEvent & { clientName?: string })[];
  clients: ClientRow[];
}

export type PeriodKey = "month" | "3m" | "12m" | "year" | "all";

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "month", label: "This month" },
  { key: "3m", label: "3 months" },
  { key: "12m", label: "12 months" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

// Query string for a period preset
export const periodQuery = (key: PeriodKey) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case "month":
      return `from=${iso(new Date(Date.UTC(y, m, 1)))}&to=${iso(now)}`;
    case "3m":
      return `from=${iso(new Date(Date.UTC(y, m - 2, 1)))}&to=${iso(now)}`;
    case "year":
      return `from=${iso(new Date(Date.UTC(y, 0, 1)))}&to=${iso(now)}`;
    case "all":
      return "all=1";
    default:
      return `from=${iso(new Date(Date.UTC(y, m - 11, 1)))}&to=${iso(now)}`;
  }
};

// "2026-03" -> "Mar 26"
export const monthLabel = (key: string, withYear = true) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("en-IN", { month: "short", ...(withYear ? { year: "2-digit" } : {}), timeZone: "UTC" });
};

// ₹1.2L / ₹45K style for chart axes
export const compactMoney = (amount: number) => {
  const short = (n: number) => String(Number(n.toFixed(1)));
  if (amount >= 1e7) return `₹${short(amount / 1e7)}Cr`;
  if (amount >= 1e5) return `₹${short(amount / 1e5)}L`;
  if (amount >= 1e3) return `₹${short(amount / 1e3)}K`;
  return `₹${Math.round(amount)}`;
};

// Chart colours (validated categorical slots 1-2 and the surfaces they sit on)
export const VIZ = {
  light: { series1: "#2a78d6", series2: "#eb6834", grid: "#e7e5e4", axis: "#78716c", text: "#0b0b0b", surface: "#ffffff" },
  dark: { series1: "#3987e5", series2: "#d95926", grid: "#27272a", axis: "#a1a1aa", text: "#f0efec", surface: "#09090b" },
};
