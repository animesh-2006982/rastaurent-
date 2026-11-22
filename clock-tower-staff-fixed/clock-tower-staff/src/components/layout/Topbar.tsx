"use client";

import { Bell, Search, ChevronDown, Menu, MoreVertical, X } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useState } from "react";

export default function Topbar({ role }: { role?: string }) {
  const { user } = useAuthContext();

  const [moreOpen, setMoreOpen] = useState(false);

  const initials =
    user?.name
      ?.split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2) || "CT";

  const toggleSidebar = () => {
    window.dispatchEvent(new Event("toggle-sidebar"));
  };

  return (
    <header className="topbar">

      {/* HAMBURGER */}
      <button
        type="button"
        className="mobile-menu"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <Menu size={24} />
      </button>

      {/* SEARCH */}
      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search anything..."
          aria-label="Search"
        />
      </div>

      {/* RIGHT ACTIONS */}
      <div className="top-actions">

        {/* NOTIFICATION */}
        <button
          type="button"
          className="icon-btn notification-btn"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <i />
        </button>

        {/* USER */}
        <button
          type="button"
          className="user-chip"
          onClick={() => setMoreOpen(false)}
        >
          <div className="avatar">
            {initials}
          </div>

          <div className="user-info">
            <b>{user?.name || "Clock Tower"}</b>
            <small>
              {role || user?.role || "Staff"}
            </small>
          </div>

          <ChevronDown size={15} />
        </button>

        {/* THREE DOT */}
        <div className="top-more-wrapper">

          <button
            type="button"
            className="icon-btn more-btn"
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="More options"
          >
            {moreOpen ? (
              <X size={20} />
            ) : (
              <MoreVertical size={20} />
            )}
          </button>

          {moreOpen && (
            <div className="top-more-menu">

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/pos/manager";
                }}
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/orders";
                }}
              >
                Orders
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/tables";
                }}
              >
                Tables
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/kitchen";
                }}
              >
                Kitchen
              </button>

            </div>
          )}

        </div>

      </div>
    </header>
  );
}