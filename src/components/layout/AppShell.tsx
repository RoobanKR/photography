"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Aperture,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  HardDrive,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Sun,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string; // hidden from users without it
  soon?: boolean;
}

// "soon" items are planned in later phases and shown disabled until built
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: CalendarDays, permission: "events.view" },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck, permission: "bookings.view" },
  { label: "Users & Roles", href: "/users", icon: Users, permission: "users.view" },
  { label: "Storage", href: "/storage", icon: HardDrive, permission: "storage.view" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, permission: "analytics.view" },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/events": "Events",
  "/bookings": "Bookings",
  "/users": "Users & Roles",
  "/storage": "Storage",
  "/analytics": "Analytics",
};

// Role names come from the server ("Owner", "Photographer", ...); older sessions stored "admin"
const formatRole = (role?: string) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark" ? "dark" : "light";
    setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  return { theme, toggle };
}

function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-cream dark:bg-ink-950 text-stone-600 dark:text-stone-400">
      {children}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, status, retry, logout, can } = useAuth();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close the mobile menu after navigating
  useEffect(() => setMobileOpen(false), [pathname]);

  // Studio pages use a denser scale than the public website: Tailwind sizes are in rem,
  // so a smaller root font size tightens every studio page. Removed again when leaving the studio.
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = "14.5px";
    return () => {
      root.style.fontSize = "";
    };
  }, []);

  if (status === "offline") {
    return (
      <FullScreenMessage>
        <div className="text-center space-y-4 px-6">
          <WifiOff className="w-10 h-10 mx-auto text-amber-500" />
          <div>
            <p className="font-semibold text-stone-900 dark:text-white">Can&apos;t reach the server</p>
            <p className="text-sm mt-1">You are still signed in. Start the server, then try again.</p>
          </div>
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </FullScreenMessage>
    );
  }

  if (status === "checking" && !user) {
    return (
      <FullScreenMessage>
        <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
      </FullScreenMessage>
    );
  }

  const navItems = NAV_ITEMS.filter((item) => !item.permission || can(item.permission));
  const activeItem = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const pageTitle = PAGE_TITLES[activeItem?.href ?? ""] ?? "KR5";
  const initial = user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-cream dark:bg-ink-950 text-stone-900 dark:text-white">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex h-full flex-col border-r border-stone-200 bg-white transition-all duration-300 dark:border-ink-800 dark:bg-ink-900
          ${mobileOpen ? "translate-x-0 w-56 shadow-2xl" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "md:w-14" : "md:w-52"}`}
      >
        <div className={`flex h-12 items-center ${collapsed ? "justify-center" : "justify-between px-4"}`}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="rounded-lg bg-gold-500 p-1.5 text-white shadow-sm shadow-gold-400/30">
              <Aperture className="h-5 w-5" />
            </div>
            {!collapsed && <span className="font-serif text-xl tracking-[0.2em] text-stone-800 dark:text-gold-300">KR5</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-gold-500 dark:hover:bg-ink-800 md:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="p-1 text-stone-400 md:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto py-3">
          {!collapsed && (
            <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-500/80 dark:text-gold-300/70">
              Studio
            </p>
          )}
          {navItems.map(({ label, href, icon: Icon, soon }) => {
            const active = activeItem?.href === href;
            const base = `mx-2 flex items-center rounded-lg text-sm transition-colors ${
              collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5"
            }`;

            if (soon) {
              return (
                <div
                  key={href}
                  title={`${label} (coming soon)`}
                  className={`${base} cursor-not-allowed text-stone-400 dark:text-stone-600`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="font-medium">{label}</span>
                      <span className="ml-auto rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold dark:bg-ink-800">
                        Soon
                      </span>
                    </>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`${base} ${
                  active
                    ? "bg-gold-500 font-semibold text-white shadow-md shadow-gold-400/20"
                    : "font-medium text-stone-600 hover:bg-gold-50 hover:text-gold-600 dark:text-stone-400 dark:hover:bg-ink-800 dark:hover:text-gold-300"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-100 p-2 dark:border-ink-800">
          <div className={`flex items-center gap-2.5 px-2 py-1.5 ${collapsed ? "justify-center" : ""}`}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-500 text-sm font-medium text-white">
              {initial}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-stone-400 dark:text-stone-500">{formatRole(user?.role)}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="relative flex h-full flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-12 items-center justify-between border-b border-stone-200 bg-white px-3 dark:border-ink-800 dark:bg-ink-900 md:px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-stone-500 md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-xl tracking-[0.12em] text-stone-800 dark:text-stone-100">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-gold-500 dark:hover:bg-ink-800"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-stone-100 dark:hover:bg-ink-800"
              >
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium leading-tight">{user?.name}</p>
                  <p className="text-[10px] leading-tight text-stone-400 dark:text-stone-500">{formatRole(user?.role)}</p>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-xs font-medium text-white">
                  {initial}
                </div>
                <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl dark:border-ink-800 dark:bg-ink-800">
                  <div className="border-b border-stone-100 p-4 dark:border-ink-800">
                    <p className="font-medium">{user?.name}</p>
                    <p className="truncate text-sm text-stone-500 dark:text-stone-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-cream p-3 dark:bg-ink-950 md:p-4">{children}</div>
      </main>
    </div>
  );
}
