"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { GB } from "@/lib/storage";
import Modal, { btn, inputClass } from "@/components/studio/Modal";

interface LimitDialogProps {
  target: { userId: string; name: string; isStudio: boolean; usedBytes: number; limitBytes: number | null } | null;
  onClose: () => void;
  onSaved: () => void;
}

const PRESETS = [1, 5, 10, 25, 50, 100, 250, 500];

export default function LimitDialog({ target, onClose, onSaved }: LimitDialogProps) {
  const [limitGB, setLimitGB] = useState("");
  const [unlimited, setUnlimited] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setUnlimited(target.limitBytes === null);
    setLimitGB(target.limitBytes === null ? "" : String(+(target.limitBytes / GB).toFixed(2)));
  }, [target]);

  const value = Number(limitGB);
  const invalid = !unlimited && (!limitGB || isNaN(value) || value <= 0);
  const belowUsage = !unlimited && !invalid && target && value * GB < target.usedBytes;

  const save = async () => {
    if (!target || invalid) return;
    setSaving(true);
    try {
      await api(`/storage/limits/${target.userId}`, { method: "PUT", body: { limitGB: unlimited ? null : value } });
      toast.success(unlimited ? "Limit removed" : `Limit set to ${value} GB`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={target !== null}
      onClose={saving ? () => {} : onClose}
      size="sm"
      title={target?.isStudio ? "Studio storage limit" : `Storage limit for ${target?.name}`}
      description={
        target?.isStudio
          ? "Total space all events in the studio can use."
          : "Space this person's uploads can use. Uploads stop when it's full."
      }
      footer={
        <>
          <button className={btn.secondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={btn.primary} onClick={save} disabled={saving || invalid}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save limit
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Using <strong className="text-slate-900 dark:text-white">{formatBytes(target?.usedBytes ?? 0)}</strong> now.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
          No limit
        </label>

        {!unlimited && (
          <>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((gb) => (
                <button
                  key={gb}
                  type="button"
                  onClick={() => setLimitGB(String(gb))}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    value === gb
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      : "border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  }`}
                >
                  {gb} GB
                </button>
              ))}
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Custom (GB)</span>
              <input type="number" min="0.1" step="0.5" className={inputClass} value={limitGB} onChange={(e) => setLimitGB(e.target.value)} autoFocus />
            </label>
            {belowUsage && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                This is less than what&apos;s already used. Existing files stay, but new uploads will be blocked until space is freed.
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
