import React from "react";
import "./room.css";

export default function RoomModal({ open, title="Room", children, onClose }) {
  if (!open) return null;
  return <div className="room-modal-backdrop" onMouseDown={onClose}><div className="room-modal" onMouseDown={e=>e.stopPropagation()}><div className="room-modal-head"><h2>{title}</h2><button className="modal-close" onClick={onClose}>×</button></div>{children}</div></div>;
}
