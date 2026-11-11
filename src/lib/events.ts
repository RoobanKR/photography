// Shared event types and helpers for the studio pages

import type { Person } from "./faces";

export type MediaType = "image" | "video" | "document";

export interface MediaFile {
  _id?: string;
  publicId: string;
  url: string;
  type: MediaType;
  originalName: string;
  size: number;
  format: string;
  folderPath?: string;
  uploadedAt: string;
  facesScanned?: boolean;
}

export interface StudioEvent {
  _id: string;
  eventName: string;
  eventType: EventTypeKey;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  description: string;
  eventDate: string;
  startTime: string;
  eventPlace: string;
  expiryDate: string;
  status: "active" | "expired" | "cancelled";
  qrCode: string;
  coverPublicId: string;
  mediaFiles: MediaFile[];
  people?: Person[];
  createdAt: string;
  updatedAt: string;
}

export interface EventFormValues {
  eventName: string;
  eventType: EventTypeKey;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  eventDate: string;
  startTime: string;
  eventPlace: string;
  expiryDate: string;
  description: string;
}

export const EVENT_TYPES = {
  wedding: { label: "Wedding", tone: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" },
  engagement: { label: "Engagement", tone: "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300" },
  "pre-wedding": { label: "Pre-wedding", tone: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300" },
  reception: { label: "Reception", tone: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
  birthday: { label: "Birthday", tone: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" },
  "baby-shower": { label: "Baby shower", tone: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300" },
  maternity: { label: "Maternity", tone: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300" },
  corporate: { label: "Corporate", tone: "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300" },
  portrait: { label: "Portrait", tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300" },
  other: { label: "Other", tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
} as const;

export type EventTypeKey = keyof typeof EVENT_TYPES;

// Cover background for events that don't have photos yet
export const EVENT_GRADIENTS: Record<EventTypeKey, string> = {
  wedding: "from-rose-500 via-pink-500 to-orange-400",
  engagement: "from-pink-500 via-fuchsia-500 to-purple-500",
  "pre-wedding": "from-fuchsia-500 via-purple-500 to-indigo-500",
  reception: "from-purple-600 via-violet-500 to-blue-500",
  birthday: "from-amber-400 via-orange-500 to-rose-500",
  "baby-shower": "from-sky-400 via-cyan-400 to-teal-400",
  maternity: "from-teal-400 via-emerald-500 to-lime-400",
  corporate: "from-slate-600 via-slate-700 to-zinc-800",
  portrait: "from-indigo-500 via-blue-600 to-cyan-500",
  other: "from-blue-600 via-indigo-600 to-violet-600",
};

export const PHASE_DOTS: Record<"upcoming" | "completed" | "expired", string> = {
  upcoming: "bg-blue-500",
  completed: "bg-emerald-500",
  expired: "bg-zinc-400",
};

export const eventTypeLabel = (type?: string) =>
  EVENT_TYPES[(type as EventTypeKey) ?? "other"]?.label ?? "Other";

// Event dates are calendar dates stored at UTC midnight, so always read them in UTC
export const toDateInput = (value?: string) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export const todayInput = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const formatEventDate = (value: string, options: Intl.DateTimeFormatOptions = {}) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  });

// "Today", "Tomorrow", "In 5 days", "3 days ago" for a calendar date
export const relativeDay = (value: string) => {
  const days = Math.round((Date.parse(toDateInput(value)) - Date.parse(todayInput())) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
};

export const formatTime = (value?: string) => {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

export type EventPhase = "upcoming" | "completed" | "expired";

export const eventPhase = (event: Pick<StudioEvent, "eventDate" | "expiryDate">): EventPhase => {
  const today = todayInput();
  if (toDateInput(event.expiryDate) < today) return "expired";
  if (toDateInput(event.eventDate) >= today) return "upcoming";
  return "completed";
};

export const PHASE_STYLES: Record<EventPhase, { label: string; tone: string }> = {
  upcoming: { label: "Upcoming", tone: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
  completed: { label: "Completed", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
  expired: { label: "Gallery expired", tone: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
};

// Cloudinary delivers resized copies when a transformation is added after /upload/
export const cloudinaryUrl = (url: string, transform: string) =>
  url.includes("/upload/") ? url.replace("/upload/", `/upload/${transform}/`) : url;

export const thumbUrl = (media: MediaFile, size = 400) =>
  media.type === "video"
    ? cloudinaryUrl(media.url, `so_1,c_fill,w_${size},h_${size},q_auto`).replace(/\.\w+$/, ".jpg")
    : cloudinaryUrl(media.url, `c_fill,w_${size},h_${size},q_auto,f_auto`);

export const coverImage = (event: StudioEvent) => {
  const images = event.mediaFiles?.filter((m) => m.type === "image") ?? [];
  return images.find((m) => m.publicId === event.coverPublicId) ?? images[0] ?? null;
};

export const mediaSummary = (media: MediaFile[] = []) => {
  const photos = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");
  const sum = (list: MediaFile[]) => list.reduce((total, m) => total + (m.size || 0), 0);
  return {
    photos: photos.length,
    videos: videos.length,
    photoBytes: sum(photos),
    videoBytes: sum(videos),
    totalBytes: sum(media),
  };
};
