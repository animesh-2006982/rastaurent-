"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  WalletCards,
  Table2,
  UtensilsCrossed,
  ChefHat,
  Clock3,
  Tags,
  Boxes,
  Users,
  BarChart3,
  SlidersHorizontal,
  Settings,
  LogOut,
  X,
  Hotel,
  BedDouble,
  CalendarCheck,
  LogIn,
  LogOut as LogOutIcon,
  UserRound,
  Sparkles,
  ChevronDown,
} from "lucide-react";

import { useEffect, useState } from "react";

import Brand from "@/components/layout/Brand";
import { useAuthContext } from "@/context/AuthContext";

const links = [
  ["/pos/manager", "Dashboard", LayoutDashboard],
  ["/orders", "Orders", ClipboardList],
  ["/pos/cashier", "POS - Cashier", WalletCards],
  ["/tables", "Tables", Table2],
  ["/pos/waiter", "New Order", UtensilsCrossed],
  ["/kitchen", "Kitchen", ChefHat],
  ["/shift", "Shift", Clock3],
  ["/pos/manager?tab=menu", "Menu", Tags],
  ["/pos/manager?tab=ingredients", "Inventory", Boxes],
  ["/pos/manager?tab=employees", "Employees", Users],
  ["/pos/manager?tab=reports", "Reports", BarChart3],
  [
    "/pos/manager?tab=customization",
    "Customization",
    SlidersHorizontal,
  ],
  ["/pos/manager?tab=settings", "Settings", Settings],
] as const;

const frontDeskLinks = [
  ["/front-desk/room-status", "Room Status", BedDouble],
  ["/front-desk/reservations", "Reservations", CalendarCheck],
  ["/front-desk/check-in", "Check-in", LogIn],
  ["/front-desk/check-out", "Check-out", LogOutIcon],
  ["/front-desk/guests", "Guest List", UserRound],
  ["/front-desk/housekeeping", "Housekeeping", Sparkles],
] as const;

export default function Sidebar({
  active = "",
}: {
  active?: string;
}) {
  const { user, logout } = useAuthContext();

  const [open, setOpen] = useState(false);
  const [frontDeskOpen, setFrontDeskOpen] = useState(true);

  useEffect(() => {
    const toggle = () => {
      setOpen((value) => !value);
    };

    window.addEventListener("toggle-sidebar", toggle);

    return () => {
      window.removeEventListener("toggle-sidebar", toggle);
    };
  }, []);

  const closeSidebar = () => {
    setOpen(false);
  };

  const isFrontDeskActive =
    active === "Front Desk" ||
    active === "Room Status" ||
    active === "Reservations" ||
    active === "Check-in" ||
    active === "Check-out" ||
    active === "Guest List" ||
    active === "Housekeeping";

  return (
    <>
      {/* MOBILE OVERLAY */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`sidebar ${
          open ? "sidebar-open" : ""
        }`}
      >
        {/* MOBILE CLOSE */}
        <button
          type="button"
          className="sidebar-close"
          onClick={closeSidebar}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        {/* BRAND */}
        <div className="brand-wrap">
          <Brand />
        </div>

        <nav>
          {/* ============================
              DASHBOARD
          ============================ */}

          <Link
            href="/pos/manager"
            className={`nav-link ${
              active === "Dashboard" ? "active" : ""
            }`}
            onClick={closeSidebar}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          {/* ============================
              ORDERS
          ============================ */}

          <Link
            href="/orders"
            className={`nav-link ${
              active === "Orders" ? "active" : ""
            }`}
            onClick={closeSidebar}
          >
            <ClipboardList size={18} />
            <span>Orders</span>
          </Link>

          {/* ============================
              FRONT DESK
          ============================ */}

          <div className="front-desk-menu">
            <div
              className={`front-desk-main ${
                isFrontDeskActive ? "active" : ""
              }`}
            >
              <Link
                href="/front-desk"
                className="front-desk-title"
                onClick={closeSidebar}
              >
                <Hotel size={18} />
                <span>Front Desk</span>
              </Link>

              <button
                type="button"
                className="front-desk-toggle"
                onClick={() =>
                  setFrontDeskOpen(
                    (value) => !value
                  )
                }
                aria-label="Toggle Front Desk menu"
                aria-expanded={frontDeskOpen}
              >
                <ChevronDown
                  size={16}
                  className={
                    frontDeskOpen
                      ? "front-desk-chevron open"
                      : "front-desk-chevron"
                  }
                />
              </button>
            </div>

            {frontDeskOpen && (
              <div className="front-desk-submenu">
                {frontDeskLinks.map(
                  ([href, label, Icon]) => (
                    <Link
                      key={label}
                      href={href}
                      className={`front-desk-sub-link ${
                        active === label
                          ? "active"
                          : ""
                      }`}
                      onClick={closeSidebar}
                    >
                      <Icon size={15} />
                      <span>{label}</span>
                    </Link>
                  )
                )}
              </div>
            )}
          </div>

          {/* ============================
              OTHER NAVIGATION
          ============================ */}

          {links
            .filter(
              ([, label]) =>
                label !== "Dashboard" &&
                label !== "Orders"
            )
            .map(
              ([href, label, Icon]) => (
                <Link
                  key={label}
                  href={href}
                  className={`nav-link ${
                    active === label
                      ? "active"
                      : ""
                  }`}
                  onClick={closeSidebar}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              )
            )}
        </nav>

        {/* ============================
            BOTTOM SECTION
        ============================ */}

        <div className="sidebar-bottom">
          <button
            type="button"
            className="nav-link"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

          <div className="staff-mini">
            <div className="avatar">
              {user?.name
                ?.split(" ")
                .map((x) => x[0])
                .join("")
                .slice(0, 2) || "CT"}
            </div>

            <div>
              <b>{user?.name || "Staff"}</b>

              <small>
                {user?.role || "Employee"}
              </small>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}