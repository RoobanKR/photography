// Storage shapes returned by /api/storage

export interface UsageBucket {
  bytes: number;
  photos: number;
  photoBytes: number;
  videos: number;
  videoBytes: number;
  others: number;
  otherBytes: number;
}

export interface EventUsage extends UsageBucket {
  id: string;
  eventName: string;
  eventType: string;
  eventDate: string;
}

export interface UserUsage extends UsageBucket {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  roleName: string;
  isActive: boolean;
  limitBytes: number | null;
}

export interface StorageReport {
  total: UsageBucket;
  studioLimitBytes: number | null;
  perEvent: EventUsage[];
  users: UserUsage[];
  canManageLimits: boolean;
  isOwner: boolean;
}

export const GB = 1024 ** 3;

export const usagePercent = (used: number, limit: number | null) =>
  limit ? Math.min((used / limit) * 100, 100) : 0;

// Bar colour: calm until 75%, warning until 90%, then danger
export const usageTone = (percent: number) =>
  percent >= 90 ? "bg-red-500" : percent >= 75 ? "bg-amber-500" : "bg-blue-600";

export const MEDIA_COLORS = {
  photos: "bg-emerald-500",
  videos: "bg-rose-500",
  others: "bg-slate-400",
};
