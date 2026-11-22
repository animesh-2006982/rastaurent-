"use client";

import React, { useState } from "react";
import {
  BedDouble,
  CalendarCheck,
  LogIn,
  LogOut,
  Users,
  Sparkles,
} from "lucide-react";

import RoomStatus from "./RoomStatus";
import Reservations from "./Reservations";
import CheckIn from "./CheckIn";
import CheckOut from "./CheckOut";
import GuestList from "./GuestList";
import Housekeeping from "./Housekeeping";


type Staff = {
  id?: string;
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  branchId?: string;
  phone?: string;
  active?: boolean;
};

type FrontDeskProps = {
  currentStaff?: Staff | null;
  branchId?: string;
};

const FRONT_DESK_TABS = [
  {
    key: "room-status",
    label: "Room Status",
    icon: BedDouble,
  },
  {
    key: "reservations",
    label: "Reservations",
    icon: CalendarCheck,
  },
  {
    key: "check-in",
    label: "Check-in",
    icon: LogIn,
  },
  {
    key: "check-out",
    label: "Check-out",
    icon: LogOut,
  },
  {
    key: "guests",
    label: "Guest List",
    icon: Users,
  },
  {
    key: "housekeeping",
    label: "Housekeeping",
    icon: Sparkles,
  },
] as const;

type FrontDeskTab = (typeof FRONT_DESK_TABS)[number]["key"];

export default function FrontDesk({
  currentStaff,
  branchId = "all",
}: FrontDeskProps) {
  const [activeTab, setActiveTab] =
    useState<FrontDeskTab>("room-status");

  const renderContent = () => {
    switch (activeTab) {
      case "room-status":
        return (
          <RoomStatus
            currentStaff={currentStaff}
            branchId={branchId}
          />
        );

      case "reservations":
        return (
          <Reservations
            currentStaff={currentStaff}
            branchId={branchId}
          />
        );

      case "check-in":
        return (
          <CheckIn
            currentStaff={currentStaff}
            branchId={branchId}
          />
        );

      case "check-out":
        return (
          <CheckOut
            currentStaff={currentStaff}
            branchId={branchId}
          />
        );

      case "guests":
        return (
          <GuestList
            currentStaff={currentStaff}
            branchId={branchId}
          />
        );

      case "housekeeping":
        return (
          <Housekeeping
            currentStaff={currentStaff}
            branchId={branchId}
          />
        );

      default:
        return (
          <RoomStatus
            currentStaff={currentStaff}
            branchId={branchId}
          />
        );
    }
  };

  return (
    <section className="front-desk-module">
      <div className="front-desk-header">
        <div>
          <span className="front-desk-kicker">
            FRONT DESK
          </span>

          <h2>Guest & Room Operations</h2>

          <p>
            Manage rooms, reservations, check-in,
            check-out, guests and housekeeping.
          </p>
        </div>

        <div className="front-desk-live">
          <span />
          Live
        </div>
      </div>

      <div className="front-desk-tabs">
        {FRONT_DESK_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              className={`front-desk-tab ${
                active ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="front-desk-content">
        {renderContent()}
      </div>
    </section>
  );
}