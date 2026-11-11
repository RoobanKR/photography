"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";

// Every page inside (app)/ requires login and shares the sidebar + top bar
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </AuthProvider>
  );
}
