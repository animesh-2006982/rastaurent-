import React from "react";
import "./room.css";

export default function RoomCard({ room, onEdit, onDelete }) {
  const status = room.status || "Available";
  return <article className="room-status-card"><div className="room-status-top"><span className="room-number">#{room.roomNumber || room.id}</span><span className={`room-badge status-${status.toLowerCase().replaceAll(" ","-")}`}>{status}</span></div><h3>{room.categoryName || room.name || "Room"}</h3><p>{room.floor || "Floor not set"} • {room.bedType || "Standard bed"}</p><div className="room-card-meta"><span>👤 {room.maxGuests || 2}</span><span>₹{Number(room.price||0).toLocaleString("en-IN")}/night</span></div>{(onEdit||onDelete)&&<div className="card-actions">{onEdit&&<button onClick={()=>onEdit(room)}>Edit</button>}{onDelete&&<button onClick={()=>onDelete(room)} className="danger-text">Delete</button>}</div>}</article>;
}
