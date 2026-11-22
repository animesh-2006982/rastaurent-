"use client";

import type { ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import MobileNav from "@/components/layout/MobileNav";

import { useAuthContext } from "@/context/AuthContext";

interface StaffLayoutProps {
  children: ReactNode;
  active?: string;
}

export default function StaffLayout({
  children,
  active = "",
}: StaffLayoutProps) {
  const { user } = useAuthContext();

  return (
    <div className="ct-app">

      {/* =========================
          LEFT SIDEBAR
      ========================= */}
      <Sidebar active={active} />

      {/* =========================
          MAIN AREA
      ========================= */}
      <main className="ct-main">

        {/* TOPBAR */}
        <Topbar role={user?.role} />

        {/* PAGE CONTENT */}
        <div className="ct-content">
          {children}
        </div>

      </main>

      {/* =========================
          MOBILE NAV
      ========================= */}
      <MobileNav />

    </div>
  );
}