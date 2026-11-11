// Types for the Users & Roles page (shapes returned by /api/team)

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isOwner: boolean;
  roleId: string | null;
  roleName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface TeamRole {
  id: string;
  key: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
}

export interface PermissionGroup {
  key: string;
  label: string;
  permissions: { key: string; label: string; description: string }[];
}

// Readable random password for new team members
export const generatePassword = (length = 10) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "?";
