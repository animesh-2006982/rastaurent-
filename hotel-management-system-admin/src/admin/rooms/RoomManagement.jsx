import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BedDouble,
  Tags,
  CalendarCheck,
  LogIn,
  LogOut,
  Sparkles,
  BadgeIndianRupee,
  Settings,
} from "lucide-react";

import RoomDashboard from "./RoomDashboard";
import Rooms from "./Rooms";
import RoomCategories from "./RoomCategories";
import Availability from "./Availability";
import RoomBookings from "./RoomBookings";
import CheckIn from "./CheckIn";
import CheckOut from "./CheckOut";
import Housekeeping from "./Housekeeping";
import RoomRates from "./RoomRates";
import RoomSettings from "./RoomSettings";

const ROOM_TABS = [
  { key: "dashboard", label: "Room Dashboard", icon: LayoutDashboard },
  { key: "rooms", label: "Rooms", icon: BedDouble },
  { key: "categories", label: "Room Categories", icon: Tags },
  { key: "availability", label: "Availability", icon: CalendarCheck },
  { key: "bookings", label: "Room Bookings", icon: CalendarCheck },
  { key: "checkin", label: "Check-in", icon: LogIn },
  { key: "checkout", label: "Check-out", icon: LogOut },
  { key: "housekeeping", label: "Housekeeping", icon: Sparkles },
  { key: "rates", label: "Room Rates", icon: BadgeIndianRupee },
  { key: "settings", label: "Room Settings", icon: Settings },
];

export default function RoomManagement({ currentStaff, branchId = "all", initialTab = "dashboard", onTabChange }) {
  const [activeTab, setActiveTab] = useState(initialTab || "dashboard");

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    try { localStorage.setItem("clocktower-room-tab", activeTab); } catch {}
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  const selectTab = (key) => {
    setActiveTab(key);
    onTabChange?.(key);
  };

  const renderRoomPage = () => {
    switch (activeTab) {
      case "rooms": return <Rooms currentStaff={currentStaff} branchId={branchId} />;
      case "categories": return <RoomCategories currentStaff={currentStaff} branchId={branchId} />;
      case "availability": return <Availability currentStaff={currentStaff} branchId={branchId} />;
      case "bookings": return <RoomBookings currentStaff={currentStaff} branchId={branchId} />;
      case "checkin": return <CheckIn currentStaff={currentStaff} branchId={branchId} />;
      case "checkout": return <CheckOut currentStaff={currentStaff} branchId={branchId} />;
      case "housekeeping": return <Housekeeping currentStaff={currentStaff} branchId={branchId} />;
      case "rates": return <RoomRates currentStaff={currentStaff} branchId={branchId} />;
      case "settings": return <RoomSettings currentStaff={currentStaff} branchId={branchId} />;
      case "dashboard":
      default: return <RoomDashboard currentStaff={currentStaff} branchId={branchId} />;
    }
  };

  return (
    <div className="room-management-module">
      <div className="room-management-tabs">
        {ROOM_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} type="button" onClick={() => selectTab(tab.key)} className={active ? "active" : ""}>
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div className="room-management-content">{renderRoomPage()}</div>
    </div>
  );
}
