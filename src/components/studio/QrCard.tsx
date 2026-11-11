"use client";

import { useState } from "react";
import { Check, Copy, Download, ExternalLink, Loader2, QrCode, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { formatEventDate } from "@/lib/events";
import { btn } from "./Modal";

interface QrCardProps {
  eventId: string;
  eventName: string;
  eventDate: string;
  qrCode: string;
  guestUrl: string;
  canRegenerate?: boolean;
  onRegenerated: (qrCode: string, guestUrl: string) => void;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the QR image"));
    img.src = src;
  });

// Builds a print-ready card: event name, date, QR code and the link underneath
async function buildQrPoster(qrCode: string, eventName: string, eventDate: string, guestUrl: string) {
  const qr = await loadImage(qrCode);
  const width = 800;
  const height = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "center";

  ctx.font = "bold 44px system-ui, sans-serif";
  let title = eventName;
  while (ctx.measureText(title).width > width - 80 && title.length > 4) title = `${title.slice(0, -2)}…`;
  ctx.fillText(title, width / 2, 100);

  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText(formatEventDate(eventDate, { weekday: "long" }), width / 2, 150);

  ctx.drawImage(qr, 140, 200, 520, 520);

  ctx.font = "bold 30px system-ui, sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText("Scan to view and download your photos", width / 2, 790);
  ctx.font = "22px system-ui, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText(guestUrl, width / 2, 840);

  return canvas.toDataURL("image/png");
}

export default function QrCard({ eventId, eventName, eventDate, qrCode, guestUrl, canRegenerate = true, onRegenerated }: QrCardProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"download" | "regenerate" | null>(null);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };

  const download = async () => {
    setBusy("download");
    try {
      const png = await buildQrPoster(qrCode, eventName, eventDate, guestUrl);
      const link = document.createElement("a");
      link.href = png;
      link.download = `${eventName.replace(/[^\w-]+/g, "_")}_QR.png`;
      link.click();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const regenerate = async () => {
    setBusy("regenerate");
    try {
      const data = await api<{ qrCode: string; guestUrl: string }>(`/events/${eventId}/qr`, { method: "POST" });
      onRegenerated(data.qrCode, data.guestUrl);
      toast.success("QR code updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold">Guest QR code</h3>
      </div>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Guests scan to open the gallery and find their photos.</p>

      <div className="mt-3 flex justify-center rounded-xl bg-white p-2 ring-1 ring-slate-200 dark:ring-zinc-800">
        {qrCode ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrCode} alt={`QR code for ${eventName}`} className="h-36 w-36" />
        ) : (
          <div className="flex h-36 w-36 items-center justify-center text-sm text-slate-400">No QR code yet</div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-zinc-300">{guestUrl}</span>
        <button onClick={copyLink} className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800" aria-label="Copy link">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className={btn.primary} onClick={download} disabled={!qrCode || busy !== null}>
          {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download
        </button>
        <a href={guestUrl} target="_blank" rel="noreferrer" className={btn.secondary}>
          <ExternalLink className="h-4 w-4" /> Open
        </a>
      </div>
      {canRegenerate && (
      <button
        onClick={regenerate}
        disabled={busy !== null}
        className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 disabled:opacity-60 dark:text-zinc-500"
      >
        {busy === "regenerate" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        Regenerate (if your site address changed)
      </button>
      )}
    </section>
  );
}
