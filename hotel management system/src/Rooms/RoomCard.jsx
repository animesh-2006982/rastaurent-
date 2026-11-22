import React from "react";
import { BedDouble, Users, Wifi, Wind } from "lucide-react";
import "./rooms.css";

export default function RoomCard({
  room,
  nights = 1,
  onBook,
}) {
  const total = Number(room.price || 0) * Number(nights || 1);

  return (
    <article className="room-card">
      <div className="room-card-image">
        {room.image ? <img src={room.image} alt={room.name} /> : <BedDouble size={42} />}
        <span>{room.category}</span>
      </div>

      <div className="room-card-body">
        <div className="room-card-head">
          <div>
            <small>STAY</small>
            <h2>{room.name}</h2>
          </div>
          <strong>₹{room.price}<small>/night</small></strong>
        </div>

        <p>{room.description || "Comfortable stay with restaurant access and essential guest amenities."}</p>

        <div className="room-card-meta">
          <span><Users size={14} /> {room.guests || 2} guests</span>
          <span>{room.ac ? <Wind size={14} /> : <Wifi size={14} />} {room.ac ? "AC" : "Standard"}</span>
        </div>

        <div className="room-card-bottom">
          <span>{nights} night{nights === 1 ? "" : "s"} · ₹{total.toLocaleString("en-IN")}</span>
          <button type="button" onClick={() => onBook?.(room)}>
            Book
          </button>
        </div>
      </div>
    </article>
  );
}
