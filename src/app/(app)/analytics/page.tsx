"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  HardDrive,
  Image as ImageIcon,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  Search,
  Table2,
  TrendingUp,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import {
  AnalyticsReport,
  ClientRow,
  compactMoney,
  monthLabel,
  PeriodKey,
  PERIODS,
  periodQuery,
  VIZ,
} from "@/lib/analytics";
import { bookingNumber, METHOD_LABELS, SOURCE_LABELS, STATUS_ORDER, STATUS_STYLES } from "@/lib/bookings";
import { eventTypeLabel, formatEventDate } from "@/lib/events";
import { formatBytes, formatMoney } from "@/lib/format";
import Modal from "@/components/studio/Modal";
import RequirePermission from "@/components/studio/RequirePermission";

export default function AnalyticsPageWithAccess() {
  return (
    <RequirePermission permission="analytics.view">
      <AnalyticsPage />
    </RequirePermission>
  );
}

// Follows the app's light/dark switch (a class on <html>)
function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

const card = "rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";

function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodKey>("12m");
  const [view, setView] = useState<"overview" | "clients">("overview");
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api<AnalyticsReport>(`/analytics?${periodQuery(period)}`)
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="mx-auto max-w-7xl space-y-3 p-4 md:p-4">
      {/* Header + filters in one row */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            {report
              ? `${formatEventDate(report.range.from)} – ${formatEventDate(report.range.to)} · by shoot date; payments by date received`
              : "Money, bookings, storage and clients"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-900">
            {(["overview", "clients"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === v ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {v === "overview" ? <BarChart3 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {v === "overview" ? "Overview" : "Clients"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-zinc-900">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p.key ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className={`${card} p-10 text-center text-sm text-red-600`}>{error}</div>
      ) : !report ? (
        <div className={`${card} flex items-center justify-center gap-2 p-16 text-sm text-slate-500`}>
          <Loader2 className="h-4 w-4 animate-spin" /> Building your report…
        </div>
      ) : (
        <div className={`space-y-3 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {view === "overview" ? <Overview report={report} /> : <Clients report={report} />}
        </div>
      )}
    </div>
  );
}

/* ================= OVERVIEW ================= */

function Kpi({ icon: Icon, label, value, hint, tone }: { icon: React.ElementType; label: string; value: string; hint?: string; tone: string }) {
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center gap-2">
        <span className={`rounded-lg p-1.5 ${tone}`}><Icon className="h-4 w-4" /></span>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{label}</p>
      </div>
      <p className="mt-3 truncate text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

function Overview({ report }: { report: AnalyticsReport }) {
  const { totals, storage } = report;
  const limitPercent = storage.limitBytes ? Math.min(100, Math.round((storage.bytes / storage.limitBytes) * 100)) : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={IndianRupee} label="Booked" value={formatMoney(totals.bookedValue)} hint={`${totals.bookedCount} confirmed / completed`} tone="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" />
        <Kpi icon={Wallet} label="Collected" value={formatMoney(totals.collected)} hint="Payments received in this period" tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" />
        <Kpi icon={CircleDollarSign} label="To collect" value={formatMoney(totals.outstanding)} hint="Balance due today, all bookings" tone="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" />
        <Kpi icon={TrendingUp} label="Average" value={formatMoney(totals.averageBooking)} hint={`${Math.round(totals.conversionRate * 100)}% of bookings confirmed`} tone="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400" />
        <Kpi icon={CalendarDays} label="Events" value={String(totals.events)} hint={`${totals.clients} client${totals.clients === 1 ? "" : "s"}`} tone="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" />
        <Kpi
          icon={HardDrive}
          label="Storage"
          value={formatBytes(storage.bytes)}
          hint={storage.limitBytes ? `${limitPercent}% of ${formatBytes(storage.limitBytes)}` : `+${formatBytes(storage.uploadedInPeriod)} this period`}
          tone="bg-slate-100 text-slate-600 dark:bg-zinc-900 dark:text-zinc-300"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <MoneyChart report={report} />
        <BookingStatusPanel report={report} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <StorageChart report={report} />
        <BarList
          title="Revenue by event type"
          empty="No confirmed bookings in this period."
          rows={report.byEventType.map((t) => ({ label: eventTypeLabel(t.type), value: t.value, note: `${t.bookings} booking${t.bookings === 1 ? "" : "s"}` }))}
          format={formatMoney}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <BarList
          title="Where bookings come from"
          empty="No confirmed bookings in this period."
          rows={report.bySource.map((s) => ({ label: SOURCE_LABELS[s.source] ?? s.source, value: s.value, note: `${s.bookings} booking${s.bookings === 1 ? "" : "s"}` }))}
          format={formatMoney}
        />
        <BarList
          title="Payments by method"
          empty="No payments received in this period."
          rows={report.byPaymentMethod.map((m) => ({ label: METHOD_LABELS[m.method] ?? m.method, value: m.amount }))}
          format={formatMoney}
        />
        <BarList
          title="Largest events"
          empty="No photos or videos yet."
          rows={report.storageByEvent.filter((e) => e.bytes > 0).map((e) => ({ label: e.eventName, value: e.bytes, note: `${e.photos} photos · ${e.videos} videos`, href: `/events/${e.id}` }))}
          format={formatBytes}
        />
      </div>
    </>
  );
}

// Tooltip shared by the charts: values in text colours, a swatch carries the series identity
function ChartTooltip({ active, payload, label, format }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1 font-semibold text-slate-800 dark:text-zinc-100">{monthLabel(label)}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
          {p.name}
          <span className="ml-auto pl-4 font-semibold text-slate-900 dark:text-white">{format(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, children, table }: { title: string; subtitle?: string; children: React.ReactNode; table: React.ReactNode }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={`${card} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{subtitle}</p>}
        </div>
        <button
          onClick={() => setShowTable((s) => !s)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          title={showTable ? "Show chart" : "Show as table"}
        >
          {showTable ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
          {showTable ? "Chart" : "Table"}
        </button>
      </div>
      <div className="mt-4">{showTable ? table : children}</div>
    </section>
  );
}

function MoneyChart({ report }: { report: AnalyticsReport }) {
  const dark = useIsDark();
  const c = dark ? VIZ.dark : VIZ.light;
  const many = report.monthly.length > 14;

  return (
    <ChartCard
      title="Money by month"
      subtitle="Booked by shoot month · collected by payment month"
      table={
        <MonthTable
          rows={report.monthly}
          columns={[
            { label: "Booked", get: (m) => formatMoney(m.booked) },
            { label: "Collected", get: (m) => formatMoney(m.collected) },
          ]}
        />
      }
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={report.monthly} barGap={2} barCategoryGap="22%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m, !many)} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
            <YAxis tickFormatter={compactMoney} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickCount={5} allowDecimals={false} />
            <Tooltip content={<ChartTooltip format={formatMoney} />} cursor={{ fill: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }} />
            <Legend
              verticalAlign="top"
              align="right"
              height={28}
              iconType="square"
              iconSize={10}
              formatter={(value) => <span className="text-xs text-slate-600 dark:text-zinc-300">{value}</span>}
            />
            <Bar dataKey="booked" name="Booked" fill={c.series1} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="collected" name="Collected" fill={c.series2} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function StorageChart({ report }: { report: AnalyticsReport }) {
  const dark = useIsDark();
  const c = dark ? VIZ.dark : VIZ.light;
  const { storage } = report;
  const many = report.monthly.length > 14;
  const photoShare = storage.bytes ? Math.round((storage.photoBytes / storage.bytes) * 100) : 0;

  return (
    <ChartCard
      title="Storage added by month"
      subtitle={`${formatBytes(storage.bytes)} in total · ${storage.photos} photos (${formatBytes(storage.photoBytes)}) · ${storage.videos} videos (${formatBytes(storage.videoBytes)})`}
      table={<MonthTable rows={report.monthly} columns={[{ label: "Uploaded", get: (m) => formatBytes(m.uploadedBytes) }]} />}
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={report.monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m, !many)} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
            <YAxis tickFormatter={(v) => formatBytes(v)} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
            <Tooltip content={<ChartTooltip format={formatBytes} />} cursor={{ fill: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="uploadedBytes" name="Uploaded" fill={c.series1} radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Photos vs videos split of everything stored */}
      <div className="mt-4">
        <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-900">
          <div className="h-full" style={{ width: `${photoShare}%`, background: c.series1 }} />
          {photoShare < 100 && storage.videoBytes > 0 && <div className="ml-0.5 h-full flex-1" style={{ background: c.series2 }} />}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.series1 }} /><ImageIcon className="h-3.5 w-3.5" /> Photos {photoShare}%</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.series2 }} /><Video className="h-3.5 w-3.5" /> Videos {storage.bytes ? 100 - photoShare : 0}%</span>
        </div>
      </div>
    </ChartCard>
  );
}

function MonthTable({ rows, columns }: { rows: AnalyticsReport["monthly"]; columns: { label: string; get: (m: AnalyticsReport["monthly"][number]) => string }[] }) {
  return (
    <div className="max-h-72 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white text-left text-xs text-slate-500 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            <th className="py-2 font-medium">Month</th>
            {columns.map((c) => <th key={c.label} className="py-2 text-right font-medium">{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
          {rows.map((m) => (
            <tr key={m.month}>
              <td className="py-1.5">{monthLabel(m.month)}</td>
              {columns.map((c) => <td key={c.label} className="py-1.5 text-right tabular-nums">{c.get(m)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingStatusPanel({ report }: { report: AnalyticsReport }) {
  const { byStatus, bookings, conversionRate } = report.totals;
  return (
    <section className={`${card} p-4`}>
      <h2 className="font-semibold">Bookings</h2>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{bookings} with a shoot date in this period</p>
      <div className="mt-3.5 space-y-3">
        {STATUS_ORDER.map((status) => {
          const count = byStatus[status] ?? 0;
          const share = bookings ? (count / bookings) * 100 : 0;
          return (
            <div key={status}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].dot}`} /> {STATUS_STYLES[status].label}
                </span>
                <span className="font-semibold tabular-nums">{count}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-900">
                <div className="h-full rounded-full bg-slate-400 dark:bg-zinc-500" style={{ width: `${share}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-zinc-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">Confirmed rate</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{Math.round(conversionRate * 100)}%</p>
        <p className="text-xs text-slate-500 dark:text-zinc-400">of bookings became confirmed or completed</p>
      </div>
    </section>
  );
}

// Ranked list with thin magnitude bars (one hue): better than a pie for comparing amounts
function BarList({
  title,
  rows,
  format,
  empty,
}: {
  title: string;
  rows: { label: string; value: number; note?: string; href?: string }[];
  format: (n: number) => string;
  empty: string;
}) {
  const dark = useIsDark();
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <section className={`${card} p-4`}>
      <h2 className="font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-zinc-400">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.slice(0, 8).map((r) => {
            const body = (
              <>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{r.label}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{format(r.value)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-900">
                    <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: dark ? VIZ.dark.series1 : VIZ.light.series1 }} />
                  </div>
                  {r.note && <span className="shrink-0 text-[11px] text-slate-400 dark:text-zinc-500">{r.note}</span>}
                </div>
              </>
            );
            return (
              <li key={r.label + (r.href ?? "")}>
                {r.href ? <Link href={r.href} className="block rounded-md hover:opacity-80">{body}</Link> : body}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ================= CLIENTS ================= */

type SortKey = "value" | "balance" | "bytes" | "lastDate";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "value", label: "Booked value" },
  { key: "balance", label: "Balance due" },
  { key: "bytes", label: "Storage" },
  { key: "lastDate", label: "Latest shoot" },
];

const initials = (name: string) =>
  (name || "?").split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

function Clients({ report }: { report: AnalyticsReport }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("value");
  const [open, setOpen] = useState<ClientRow | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = report.clients.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) =>
      sort === "lastDate" ? +new Date(b.lastDate ?? 0) - +new Date(a.lastDate ?? 0) : (b[sort] as number) - (a[sort] as number)
    );
  }, [report.clients, query, sort]);

  const sum = (key: "value" | "paid" | "balance" | "bytes") => rows.reduce((s, c) => s + c[key], 0);

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3 dark:border-zinc-900">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client name, phone or email"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
          <ArrowDownUp className="h-4 w-4" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-700" />
          <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">
            {report.clients.length ? "No clients match your search." : "No client bookings or events in this period."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              <tr className="border-b border-slate-100 dark:border-zinc-900">
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-3 py-3 text-right font-semibold">Bookings</th>
                <th className="px-3 py-3 text-right font-semibold">Events</th>
                <th className="px-3 py-3 text-right font-semibold">Booked</th>
                <th className="px-3 py-3 text-right font-semibold">Paid</th>
                <th className="px-3 py-3 text-right font-semibold">Balance</th>
                <th className="px-3 py-3 text-right font-semibold">Media</th>
                <th className="px-4 py-3 text-right font-semibold">Storage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
              {rows.map((c) => (
                <tr key={c.key} onClick={() => setOpen(c)} className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
                        {initials(c.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.name || "Unnamed client"}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-zinc-400">{c.phone || c.email || "No contact"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.bookings.length}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.events.length}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatMoney(c.value)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-700 dark:text-emerald-400">{formatMoney(c.paid)}</td>
                  <td className={`px-3 py-3 text-right tabular-nums ${c.balance ? "font-semibold text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>{formatMoney(c.balance)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-zinc-300">{c.photos} · {c.videos}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatBytes(c.bytes)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 font-semibold dark:border-zinc-800">
              <tr>
                <td className="px-4 py-3">{rows.length} client{rows.length === 1 ? "" : "s"}</td>
                <td className="px-3 py-3 text-right tabular-nums">{rows.reduce((s, c) => s + c.bookings.length, 0)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{rows.reduce((s, c) => s + c.events.length, 0)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatMoney(sum("value"))}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatMoney(sum("paid"))}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatMoney(sum("balance"))}</td>
                <td className="px-3 py-3" />
                <td className="px-4 py-3 text-right tabular-nums">{formatBytes(sum("bytes"))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <ClientDetail client={open} onClose={() => setOpen(null)} />
    </section>
  );
}

function ClientDetail({ client, onClose }: { client: ClientRow | null; onClose: () => void }) {
  const paidShare = client && client.value ? Math.min(100, Math.round((client.paid / client.value) * 100)) : 0;
  return (
    <Modal open={client !== null} onClose={onClose} title={client?.name || "Client"} description="Bookings and events in the selected period" size="lg">
      {client && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-zinc-300">
            {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-blue-600"><Phone className="h-4 w-4" /> {client.phone}</a>}
            {client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-blue-600"><Mail className="h-4 w-4" /> {client.email}</a>}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Booked", value: formatMoney(client.value) },
              { label: "Paid", value: formatMoney(client.paid) },
              { label: "Balance", value: formatMoney(client.balance) },
              { label: "Storage", value: formatBytes(client.bytes) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 p-3 dark:bg-zinc-900">
                <p className="text-xs text-slate-500 dark:text-zinc-400">{s.label}</p>
                <p className="mt-1 text-lg font-bold tracking-tight">{s.value}</p>
              </div>
            ))}
          </div>

          {client.value > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span>Payment progress</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-200">{paidShare}% paid</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-900">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidShare}%` }} />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Bookings ({client.bookings.length})</h3>
            {client.bookings.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">No bookings in this period.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-zinc-900 dark:border-zinc-800">
                {client.bookings.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm">
                    <span className="font-mono text-xs text-slate-500">{bookingNumber(b)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[b.status].tone}`}>{STATUS_STYLES[b.status].label}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {eventTypeLabel(b.eventType)} · {formatEventDate(b.eventDate)}
                      {b.packageName && <span className="text-slate-500"> · {b.packageName}</span>}
                    </span>
                    <span className="tabular-nums">
                      {formatMoney(b.packagePrice)}
                      {b.balance > 0 && <span className="ml-2 text-xs text-rose-600 dark:text-rose-400">{formatMoney(b.balance)} due</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Events ({client.events.length})</h3>
            {client.events.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">No events in this period.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-zinc-900 dark:border-zinc-800">
                {client.events.map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-zinc-900">
                      <span className="min-w-0 flex-1 truncate font-medium">{e.eventName}</span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400">{formatEventDate(e.eventDate)}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400"><ImageIcon className="h-3.5 w-3.5" /> {e.photos}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400"><Video className="h-3.5 w-3.5" /> {e.videos}</span>
                      <span className="w-20 text-right text-xs font-semibold tabular-nums">{formatBytes(e.bytes)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
