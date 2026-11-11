"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { PermissionGroup, TeamRole } from "@/lib/team";
import Modal, { btn, inputClass } from "@/components/studio/Modal";

interface RoleFormDialogProps {
  open: boolean;
  onClose: () => void;
  role?: TeamRole | null; // edit (or view, for system roles) when set
  groups: PermissionGroup[];
  readOnly?: boolean;
  onSaved: () => void;
}

export default function RoleFormDialog({ open, onClose, role, groups, readOnly = false, onSaved }: RoleFormDialogProps) {
  const isEdit = Boolean(role);
  const locked = readOnly || Boolean(role?.isSystem);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setPermissions(new Set(role?.permissions ?? []));
    setNameError(null);
  }, [open, role]);

  const toggle = (key: string) =>
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleGroup = (group: PermissionGroup, on: boolean) =>
    setPermissions((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => (on ? next.add(p.key) : next.delete(p.key)));
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Role name is required");
      return;
    }
    setSaving(true);
    try {
      const body = { name, description, permissions: [...permissions] };
      if (isEdit) await api(`/team/roles/${role!.id}`, { method: "PUT", body });
      else await api("/team/roles", { method: "POST", body });
      toast.success(isEdit ? "Role updated" : "Role created");
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
      open={open}
      onClose={saving ? () => {} : onClose}
      size="lg"
      title={locked ? role?.name ?? "Role" : isEdit ? `Edit ${role?.name}` : "New role"}
      description={
        role?.isSystem
          ? "The Admin role always has full access and can't be changed."
          : locked
            ? "You can view this role but not change it."
            : "Choose what people with this role can do."
      }
      footer={
        locked ? (
          <button className={btn.secondary} onClick={onClose}>Close</button>
        ) : (
          <>
            <button type="button" className={btn.secondary} onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" form="role-form" className={btn.primary} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save role" : "Create role"}
            </button>
          </>
        )
      }
    >
      <form id="role-form" onSubmit={handleSubmit} noValidate className="space-y-3">
        {!locked && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Role name <span className="text-red-500">*</span></span>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                placeholder="e.g. Second shooter"
                autoFocus
              />
              {nameError && <span className="text-xs font-medium text-red-500">{nameError}</span>}
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Description</span>
              <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role is for" />
            </label>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Permissions</p>
            <span className="text-xs text-slate-400">{permissions.size} selected</span>
          </div>
          {groups.map((group) => {
            const onCount = group.permissions.filter((p) => permissions.has(p.key)).length;
            const allOn = onCount === group.permissions.length;
            return (
              <div key={group.key} className="rounded-lg border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-zinc-900 dark:bg-zinc-900/60">
                  <span className="text-sm font-semibold">{group.label}</span>
                  {locked ? (
                    <span className="text-xs text-slate-400">{onCount}/{group.permissions.length}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group, !allOn)}
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {allOn ? "Clear all" : "Select all"}
                    </button>
                  )}
                </div>
                <div className="divide-y divide-slate-100 dark:divide-zinc-900">
                  {group.permissions.map((perm) => (
                    <label
                      key={perm.key}
                      className={`flex items-start gap-3 px-4 py-2.5 ${locked ? "" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/40"}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 accent-blue-600"
                        checked={permissions.has(perm.key)}
                        onChange={() => toggle(perm.key)}
                        disabled={locked}
                      />
                      <span>
                        <span className="block text-sm font-medium">{perm.label}</span>
                        <span className="block text-xs text-slate-500 dark:text-zinc-400">{perm.description}</span>
                      </span>
                      {locked && role?.isSystem && <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300" />}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </form>
    </Modal>
  );
}
