// Booking types and labels (shapes returned by /api/bookings)
import { EventTypeKey } from "./events";

export type BookingStatus = "enquiry" | "confirmed" | "completed" | "cancelled";
export type BookingSource = "phone" | "walk-in" | "website" | "instagram" | "referral" | "other";
export type PaymentMethod = "cash" | "upi" | "card" | "bank" | "other";

export interface Payment {
  _id: string;
  amount: number;
  method: PaymentMethod;
  note: string;
  paidAt: string;
}

export interface Booking {
  _id: string;
  number: number;
  status: BookingStatus;
  source: BookingSource;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  eventType: EventTypeKey;
  eventDate: string;
  startTime: string;
  eventPlace: string;
  packageName: string;
  packagePrice: number;
  payments: Payment[];
  amountPaid: number;
  balance: number;
  assignedTo: { _id: string; name: string; email: string }[];
  notes: string;
  cancelReason: string;
  eventId: string | null;
  createdAt: string;
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
  roleName: string;
}

export const bookingNumber = (b: Pick<Booking, "number">) => `BK-${String(b.number).padStart(4, "0")}`;

export const STATUS_STYLES: Record<BookingStatus, { label: string; tone: string; dot: string }> = {
  enquiry: { label: "Enquiry", tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300", dot: "bg-amber-500" },
  confirmed: { label: "Confirmed", tone: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300", dot: "bg-blue-500" },
  completed: { label: "Completed", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", tone: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", dot: "bg-zinc-400" },
};

// Card edge and column header colours
export const STATUS_ACCENTS: Record<BookingStatus, { edge: string; header: string; avatar: string }> = {
  enquiry: { edge: "before:bg-amber-400", header: "border-t-amber-400", avatar: "from-amber-400 to-orange-500" },
  confirmed: { edge: "before:bg-blue-500", header: "border-t-blue-500", avatar: "from-blue-500 to-indigo-600" },
  completed: { edge: "before:bg-emerald-500", header: "border-t-emerald-500", avatar: "from-emerald-500 to-teal-600" },
  cancelled: { edge: "before:bg-zinc-400", header: "border-t-zinc-400", avatar: "from-zinc-400 to-zinc-500" },
};

// The usual next step offered as a one-click action on pipeline cards
export const QUICK_NEXT: Partial<Record<BookingStatus, { to: BookingStatus; label: string }>> = {
  enquiry: { to: "confirmed", label: "Confirm" },
  confirmed: { to: "completed", label: "Complete" },
};

export const STATUS_ORDER: BookingStatus[] = ["enquiry", "confirmed", "completed", "cancelled"];

// Same rules as the server
export const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
  enquiry: ["confirmed", "cancelled"],
  confirmed: ["completed", "enquiry", "cancelled"],
  completed: ["confirmed"],
  cancelled: ["enquiry"],
};

export const STATUS_ACTION_LABELS: Record<BookingStatus, string> = {
  enquiry: "Move to enquiry",
  confirmed: "Confirm booking",
  completed: "Mark completed",
  cancelled: "Cancel booking",
};

export const SOURCE_LABELS: Record<BookingSource, string> = {
  phone: "Phone call",
  "walk-in": "Walk-in",
  website: "Website",
  instagram: "Instagram",
  referral: "Referral",
  other: "Other",
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank: "Bank transfer",
  other: "Other",
};

export const paymentState = (b: Booking): { label: string; tone: string } => {
  if (b.packagePrice <= 0) return { label: "No price", tone: "text-slate-400" };
  if (b.balance <= 0) return { label: "Paid in full", tone: "text-emerald-600 dark:text-emerald-400" };
  if (b.amountPaid > 0) return { label: "Part paid", tone: "text-amber-600 dark:text-amber-400" };
  return { label: "Unpaid", tone: "text-red-600 dark:text-red-400" };
};
