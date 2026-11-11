"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Wand2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { generatePassword, PermissionGroup, TeamRole, TeamUser } from "@/lib/team";
import Modal, { btn, inputClass } from "@/components/studio/Modal";

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  user?: TeamUser | null; // edit mode when set
  roles: TeamRole[];
  groups: PermissionGroup[];
  onSaved: (user: TeamUser) => void;
}

interface Values {
  name: string;
  email: string;
  phone: string;
  roleId: string;
  password: string;
}

const MIN_PASSWORD = 6;

export default function UserFormDialog({ open, onClose, user, roles, groups, onSaved }: UserFormDialogProps) {
  const isEdit = Boolean(user);
  const [values, setValues] = useState<Values>({ name: "", email: "", phone: "", roleId: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const defaultRole = roles.find((r) => r.key === "photographer") ?? roles.find((r) => !r.isSystem) ?? roles[0];
    setValues(
      user
        ? { name: user.name, email: user.email, phone: user.phone, roleId: user.roleId ?? "", password: "" }
        : { name: "", email: "", phone: "", roleId: defaultRole?.id ?? "", password: "" }
    );
    setErrors({});
    setShowPassword(false);
  }, [open, user, roles]);

  const set = (key: keyof Values, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!values.name.trim()) e.name = "Name is required";
    if (!isEdit && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = "Enter a valid email";
    if (!values.roleId) e.roleId = "Choose a role";
    if (!isEdit && values.password.length < MIN_PASSWORD) e.password = `At least ${MIN_PASSWORD} characters`;
    if (isEdit && values.password && values.password.length < MIN_PASSWORD) e.password = `At least ${MIN_PASSWORD} characters`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const body = isEdit
        ? { name: values.name, phone: values.phone, roleId: values.roleId, ...(values.password ? { password: values.password } : {}) }
        : values;
      const data = isEdit
        ? await api<{ user: TeamUser }>(`/team/users/${user!.id}`, { method: "PUT", body })
        : await api<{ user: TeamUser }>("/team/users", { method: "POST", body });
      toast.success(isEdit ? "User updated" : `${data.user.name} added. Share their email and password with them.`);
      onSaved(data.user);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === values.roleId);
  const permissionLabels = new Map(groups.flatMap((g) => g.permissions.map((p) => [p.key, p.label] as const)));

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={isEdit ? `Edit ${user?.name}` : "Add user"}
      description={isEdit ? "Change their details or role." : "They sign in with this email and password."}
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="user-form" className={btn.primary} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add user"}
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Full name <span className="text-red-500">*</span></span>
            <input className={inputClass} value={values.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            {errors.name && <span className="text-xs font-medium text-red-500">{errors.name}</span>}
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Phone</span>
            <input type="tel" className={inputClass} value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Email <span className="text-red-500">*</span></span>
          <input
            type="email"
            className={`${inputClass} disabled:opacity-60`}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            disabled={isEdit}
            placeholder="name@studio.com"
          />
          {errors.email ? (
            <span className="text-xs font-medium text-red-500">{errors.email}</span>
          ) : (
            isEdit && <span className="text-xs text-slate-400 dark:text-zinc-500">Email can&apos;t be changed.</span>
          )}
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
            {isEdit ? "New password" : "Password"} {!isEdit && <span className="text-red-500">*</span>}
          </span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? "text" : "password"}
                className={`${inputClass} pr-10`}
                value={values.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={isEdit ? "Leave blank to keep the current password" : `At least ${MIN_PASSWORD} characters`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button"
              className={btn.secondary}
              onClick={() => {
                set("password", generatePassword());
                setShowPassword(true);
              }}
            >
              <Wand2 className="h-4 w-4" /> Generate
            </button>
          </div>
          {errors.password ? (
            <span className="text-xs font-medium text-red-500">{errors.password}</span>
          ) : (
            isEdit && <span className="text-xs text-slate-400 dark:text-zinc-500">Setting a new password signs them out everywhere.</span>
          )}
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Role <span className="text-red-500">*</span></span>
          <select className={inputClass} value={values.roleId} onChange={(e) => set("roleId", e.target.value)}>
            <option value="" disabled>Choose a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          {errors.roleId && <span className="text-xs font-medium text-red-500">{errors.roleId}</span>}
        </label>

        {selectedRole && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-slate-500 dark:text-zinc-400">{selectedRole.description || `${selectedRole.name} can:`}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedRole.permissions.length === 0 ? (
                <span className="text-xs text-slate-400">No permissions yet</span>
              ) : (
                selectedRole.permissions.map((p) => (
                  <span key={p} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                    {permissionLabels.get(p) ?? p}
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
