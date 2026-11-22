import React from "react";
export default function RoomStatusBadge({ status="Available" }) {
  return <span className={`room-badge status-${String(status).toLowerCase().replaceAll(" ","-")}`}>{status}</span>;
}
