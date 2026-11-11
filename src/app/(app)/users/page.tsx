"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRelative } from "@/lib/format";
import { initials, PermissionGroup, TeamRole, TeamUser } from "@/lib/team";
import ConfirmDialog from "@/components/studio/ConfirmDialog";
import { btn, inputClass } from "@/components/studio/Modal";
import RequirePermission from "@/components/studio/RequirePermission";
import RoleFormDialog from "@/components/team/RoleFormDialog";
import UserFormDialog from "@/components/team/UserFormDialog";

type Tab = "users" | "roles";

type Pending =
  | { kind: "remove-user"; user: TeamUser }
  | { kind: "toggle-user"; user: TeamUser }
  | { kind: "delete-role"; role: TeamRole };

const ROLE_TONES = [
  "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
];

export default function UsersPageWithAccess() {
  return (
    <RequirePermission permission="users.view">
      <UsersPage />
    </RequirePermission>
  );
}

function UsersPage() {
  const { user: me, can } = useAuth();
  const canManage = can("users.manage");

  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [userDialog, setUserDialog] = useState<{ open: boolean; user: TeamUser | null }>({ open: false, user: null });
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; role: TeamRole | null }>({ open: false, role: null });
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, r, p] = await Promise.all([
        api<{ users: TeamUser[] }>("/team/users"),
        api<{ roles: TeamRole[] }>("/team/roles"),
        api<{ groups: PermissionGroup[] }>("/team/permissions"),
      ]);
      setUsers(u.users);
      setRoles(r.roles);
      setGroups(p.groups);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleTone = useMemo(() => {
    const map = new Map<string, string>();
    roles.forEach((r, i) => map.set(r.id, ROLE_TONES[i % ROLE_TONES.length]));
    return map;
  }, [roles]);

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => !q || [u.name, u.email, u.phone, u.roleName].some((v) => v?.toLowerCase().includes(q)));
  }, [users, search]);

  const totalPermissions = groups.reduce((sum, g) => sum + g.permissions.length, 0);
  const isMe = (u: TeamUser) => u.id === (me?.id ?? me?._id);

  const confirmPending = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.kind === "remove-user") {
        await api(`/team/users/${pending.user.id}`, { method: "DELETE" });
        toast.success(`${pending.user.name} removed`);
      } else if (pending.kind === "toggle-user") {
        await api(`/team/users/${pending.user.id}`, { method: "PUT", body: { isActive: !pending.user.isActive } });
        toast.success(pending.user.isActive ? `${pending.user.name} disabled` : `${pending.user.name} enabled`);
      } else {
        await api(`/team/roles/${pending.role.id}`, { method: "DELETE" });
        toast.success(`${pending.role.name} role deleted`);
      }
      setPending(null);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users &amp; Roles</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            {users.length} people · {activeCount} active · {roles.length} roles
          </p>
        </div>
        {canManage && (
          <button
            className={`${btn.primary} self-start py-2.5`}
            onClick={() => (tab === "users" ? setUserDialog({ open: true, user: null }) : setRoleDialog({ open: true, role: null }))}
          >
            {tab === "users" ? <UserPlus className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {tab === "users" ? "Add user" : "New role"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>
      )}

      <div className="flex gap-1 border-b border-slate-200 dark:border-zinc-800">
        {([
          { key: "users", label: "Users", icon: Users, count: users.length },
          { key: "roles", label: "Roles & permissions", icon: KeyRound, count: roles.length },
        ] as const).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === key
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
            <span className="rounded-full bg-slate-100 px-1.5 text-xs dark:bg-zinc-800">{count}</span>
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="Search by name, email, phone or role" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-zinc-900 dark:text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last sign-in</th>
                  {canManage && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                {visibleUsers.map((u) => (
                  <tr key={u.id} className={u.isActive ? "" : "opacity-60"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                          {initials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {u.name} {isMe(u) && <span className="ml-1 text-xs font-normal text-slate-400">(you)</span>}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-zinc-500">
                            {u.email}
                            {u.phone && ` · ${u.phone}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.isOwner ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
                          <Lock className="h-3 w-3" /> Owner
                        </span>
                      ) : (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleTone.get(u.roleId ?? "") ?? ROLE_TONES[0]}`}>
                          {u.roleName}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          u.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-zinc-500"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-zinc-400">{formatRelative(u.lastLoginAt)}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        {u.isOwner ? (
                          <p className="text-right text-xs text-slate-400">Studio owner</p>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <button className={btn.ghost} onClick={() => setUserDialog({ open: true, user: u })} title="Edit" aria-label={`Edit ${u.name}`}>
                              <Pencil className="h-4 w-4" />
                            </button>
                            {!isMe(u) && (
                              <>
                                <button
                                  className={btn.ghost}
                                  onClick={() => setPending({ kind: "toggle-user", user: u })}
                                  title={u.isActive ? "Disable" : "Enable"}
                                  aria-label={`${u.isActive ? "Disable" : "Enable"} ${u.name}`}
                                >
                                  {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </button>
                                <button
                                  className={`${btn.ghost} hover:text-red-600`}
                                  onClick={() => setPending({ kind: "remove-user", user: u })}
                                  title="Remove"
                                  aria-label={`Remove ${u.name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 1 && (
              <div className="border-t border-slate-100 px-4 py-8 text-center dark:border-zinc-900">
                <p className="text-sm font-medium">It&apos;s just you so far</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  Add photographers, editors and managers, and choose what each of them can do.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg p-2 ${roleTone.get(role.id)}`}>
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{role.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {role.userCount} {role.userCount === 1 ? "user" : "users"}
                    </p>
                  </div>
                </div>
                {role.isSystem && (
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <Lock className="h-3 w-3" /> System
                  </span>
                )}
              </div>
              <p className="mt-3 flex-1 text-sm text-slate-600 dark:text-zinc-300">{role.description || "No description"}</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                  <span>Permissions</span>
                  <span>{role.permissions.length} of {totalPermissions}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${totalPermissions ? (role.permissions.length / totalPermissions) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-zinc-900">
                <button className={`${btn.secondary} flex-1`} onClick={() => setRoleDialog({ open: true, role })}>
                  {canManage && !role.isSystem ? <><Pencil className="h-4 w-4" /> Edit</> : "View permissions"}
                </button>
                {canManage && !role.isSystem && (
                  <button
                    className={`${btn.secondary} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40`}
                    onClick={() => setPending({ kind: "delete-role", role })}
                    aria-label={`Delete ${role.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <UserFormDialog
        open={userDialog.open}
        user={userDialog.user}
        roles={roles}
        groups={groups}
        onClose={() => setUserDialog({ open: false, user: null })}
        onSaved={() => load()}
      />

      <RoleFormDialog
        open={roleDialog.open}
        role={roleDialog.role}
        groups={groups}
        readOnly={!canManage}
        onClose={() => setRoleDialog({ open: false, role: null })}
        onSaved={() => load()}
      />

      <ConfirmDialog
        open={pending !== null}
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirmPending}
        title={
          pending?.kind === "remove-user"
            ? `Remove ${pending.user.name}?`
            : pending?.kind === "toggle-user"
              ? `${pending.user.isActive ? "Disable" : "Enable"} ${pending.user.name}?`
              : pending?.kind === "delete-role"
                ? `Delete the ${pending.role.name} role?`
                : ""
        }
        confirmLabel={
          pending?.kind === "toggle-user" ? (pending.user.isActive ? "Disable" : "Enable") : pending?.kind === "remove-user" ? "Remove" : "Delete"
        }
        message={
          pending?.kind === "remove-user"
            ? "They will be signed out and can't sign in again. Events and photos they added stay in the studio."
            : pending?.kind === "toggle-user"
              ? pending.user.isActive
                ? "They will be signed out right away and can't sign in until you enable them again."
                : "They will be able to sign in again with their current password."
              : pending?.kind === "delete-role"
                ? pending.role.userCount > 0
                  ? `${pending.role.userCount} user(s) still have this role. Move them to another role first.`
                  : "This role will be removed. This can't be undone."
                : null
        }
      />
    </div>
  );
}
