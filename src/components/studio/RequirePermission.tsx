"use client";

import Link from "next/link";
import { Loader2, ShieldOff } from "lucide-react";
import { useAuth } from "@/lib/auth";

// Shows the page only to users with the permission. The server checks again on every request.
export default function RequirePermission({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { status, can } = useAuth();

  // Wait for the server's answer: the cached user may have old permissions
  if (status !== "authenticated") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!can(permission)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto w-fit rounded-full bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <ShieldOff className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-semibold">You don&apos;t have access to this page</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Ask your studio admin to update your role.</p>
        <Link href="/dashboard" className="mt-5 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
