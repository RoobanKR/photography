"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, FileIcon, HardDrive, Image as ImageIcon, Loader2, Settings2, Video } from "lucide-react";
import { api } from "@/lib/api";
import { eventTypeLabel, formatEventDate } from "@/lib/events";
import { formatBytes } from "@/lib/format";
import { MEDIA_COLORS, StorageReport, UsageBucket, usagePercent, usageTone } from "@/lib/storage";
import { initials } from "@/lib/team";
import LimitDialog from "@/components/storage/LimitDialog";
import { btn } from "@/components/studio/Modal";
import RequirePermission from "@/components/studio/RequirePermission";

type LimitTarget = React.ComponentProps<typeof LimitDialog>["target"];

// One bar split into photos / videos / other, as a share of `scale` bytes
function MediaBar({ usage, scale, height = "h-2" }: { usage: UsageBucket; scale: number; height?: string }) {
  const part = (bytes: number) => (scale > 0 ? `${(bytes / scale) * 100}%` : "0%");
  return (
    <div className={`flex ${height} overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800`}>
      <div className={MEDIA_COLORS.photos} style={{ width: part(usage.photoBytes) }} />
      <div className={MEDIA_COLORS.videos} style={{ width: part(usage.videoBytes) }} />
      <div className={MEDIA_COLORS.others} style={{ width: part(usage.otherBytes) }} />
    </div>
  );
}

function TypeCard({ label, icon: Icon, count, bytes, total, tone }: {
  label: string;
  icon: React.ElementType;
  count: number;
  bytes: number;
  total: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{label}</p>
        <span className={`rounded-lg p-2 ${tone}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{formatBytes(bytes)}</p>
      <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">
        {count} files · {total > 0 ? Math.round((bytes / total) * 100) : 0}% of used space
        {count > 0 && ` · avg ${formatBytes(bytes / count)}`}
      </p>
    </div>
  );
}

export default function StoragePageWithAccess() {
  return (
    <RequirePermission permission="storage.view">
      <StoragePage />
    </RequirePermission>
  );
}

function StoragePage() {
  const [report, setReport] = useState<StorageReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitTarget, setLimitTarget] = useState<LimitTarget>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const load = useCallback(() => {
    api<StorageReport>("/storage")
      .then((data) => {
        setReport(data);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const largestEvent = useMemo(() => Math.max(...(report?.perEvent.map((e) => e.bytes) ?? [0]), 1), [report]);

  if (error) {
    return <div className="mx-auto max-w-7xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>;
  }
  if (!report) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const { total, studioLimitBytes } = report;
  const percent = usagePercent(total.bytes, studioLimitBytes);
  const events = showAllEvents ? report.perEvent : report.perEvent.slice(0, 8);
  const owner = report.users.find((u) => u.isOwner);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Storage</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">How much space your events, photos and videos use.</p>
      </div>

      {/* Studio total */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"><HardDrive className="h-6 w-6" /></span>
            <div>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Studio storage</p>
              <p className="text-2xl font-bold tracking-tight">
                {formatBytes(total.bytes)}
                <span className="text-base font-medium text-slate-400"> {studioLimitBytes ? `of ${formatBytes(studioLimitBytes)}` : "used · no limit"}</span>
              </p>
            </div>
          </div>
          {report.isOwner && owner && (
            <button
              className={btn.secondary}
              onClick={() => setLimitTarget({ userId: owner.id, name: "Studio", isStudio: true, usedBytes: total.bytes, limitBytes: studioLimitBytes })}
            >
              <Settings2 className="h-4 w-4" /> {studioLimitBytes ? "Change studio limit" : "Set studio limit"}
            </button>
          )}
        </div>

        <div className="mt-3.5">
          {studioLimitBytes ? (
            <>
              <MediaBar usage={total} scale={Math.max(studioLimitBytes, total.bytes)} height="h-3" />
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                {Math.round(percent)}% used · {formatBytes(Math.max(studioLimitBytes - total.bytes, 0))} free
              </p>
            </>
          ) : (
            <MediaBar usage={total} scale={total.bytes} height="h-3" />
          )}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-zinc-300">
            <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${MEDIA_COLORS.photos}`} /> Photos {formatBytes(total.photoBytes)}</span>
            <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${MEDIA_COLORS.videos}`} /> Videos {formatBytes(total.videoBytes)}</span>
            {total.otherBytes > 0 && (
              <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${MEDIA_COLORS.others}`} /> Documents {formatBytes(total.otherBytes)}</span>
            )}
          </div>
        </div>

        {percent >= 90 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Storage is almost full. Uploads stop when the limit is reached — delete old media or raise the limit.
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TypeCard label="Photos" icon={ImageIcon} count={total.photos} bytes={total.photoBytes} total={total.bytes} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" />
        <TypeCard label="Videos" icon={Video} count={total.videos} bytes={total.videoBytes} total={total.bytes} tone="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" />
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Events</p>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"><FileIcon className="h-4 w-4" /></span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight">{report.perEvent.length}</p>
          <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-zinc-500">
            {report.perEvent[0]?.bytes
              ? `Largest: ${report.perEvent[0].eventName} (${formatBytes(report.perEvent[0].bytes)})`
              : "No media uploaded yet"}
          </p>
        </div>
      </div>

      {/* Per event */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-zinc-900">
          <h3 className="font-semibold">By event</h3>
          <span className="text-xs text-slate-400">Largest first</span>
        </div>
        {report.perEvent.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-zinc-400">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Event</th>
                  <th className="px-4 py-3 text-right font-semibold">Photos</th>
                  <th className="px-4 py-3 text-right font-semibold">Videos</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="w-48 px-4 py-3 font-semibold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <Link href={`/events/${e.id}`} className="font-medium hover:text-blue-600 dark:hover:text-blue-400">{e.eventName}</Link>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{eventTypeLabel(e.eventType)} · {formatEventDate(e.eventDate)}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {formatBytes(e.photoBytes)}
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{e.photos} files</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {formatBytes(e.videoBytes)}
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{e.videos} files</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{formatBytes(e.bytes)}</td>
                    <td className="px-4 py-3">
                      <MediaBar usage={e} scale={largestEvent} />
                      <p className="mt-1 text-[11px] text-slate-400">{total.bytes ? Math.round((e.bytes / total.bytes) * 100) : 0}% of studio</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.perEvent.length > 8 && (
              <button onClick={() => setShowAllEvents(!showAllEvents)} className="w-full border-t border-slate-100 py-3 text-sm font-medium text-blue-600 hover:bg-slate-50 dark:border-zinc-900 dark:text-blue-400 dark:hover:bg-zinc-900/50">
                {showAllEvents ? "Show fewer" : `Show all ${report.perEvent.length} events`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Per person */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-slate-100 px-4 py-4 dark:border-zinc-900">
          <h3 className="font-semibold">By team member</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            Space used by each person&apos;s uploads.{report.canManageLimits && " Set a limit to cap how much someone can upload."}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Person</th>
                <th className="px-4 py-3 text-right font-semibold">Photos</th>
                <th className="px-4 py-3 text-right font-semibold">Videos</th>
                <th className="w-64 px-4 py-3 font-semibold">Used / limit</th>
                {report.canManageLimits && <th className="px-4 py-3 text-right font-semibold" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
              {report.users.map((u) => {
                const pct = usagePercent(u.bytes, u.limitBytes);
                const canSet = report.canManageLimits && !u.isOwner && u.name !== "Removed user";
                return (
                  <tr key={u.id} className={u.isActive ? "" : "opacity-60"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">{initials(u.name)}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-zinc-500">{u.roleName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {formatBytes(u.photoBytes)}
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{u.photos} files</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {formatBytes(u.videoBytes)}
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{u.videos} files</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">
                        <strong>{formatBytes(u.bytes)}</strong>
                        <span className="text-slate-400"> {u.isOwner ? "· uses studio limit" : u.limitBytes ? `of ${formatBytes(u.limitBytes)}` : "· no limit"}</span>
                      </p>
                      {u.limitBytes ? (
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                          <div className={`h-full rounded-full ${usageTone(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                      ) : null}
                    </td>
                    {report.canManageLimits && (
                      <td className="px-4 py-3 text-right">
                        {canSet && (
                          <button
                            className={btn.ghost}
                            onClick={() => setLimitTarget({ userId: u.id, name: u.name, isStudio: false, usedBytes: u.bytes, limitBytes: u.limitBytes })}
                          >
                            <Settings2 className="h-4 w-4" /> {u.limitBytes ? "Change" : "Set limit"}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <LimitDialog target={limitTarget} onClose={() => setLimitTarget(null)} onSaved={load} />
    </div>
  );
}
