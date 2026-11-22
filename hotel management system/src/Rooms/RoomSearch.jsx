import React from "react";
import "./rooms.css";

export default function RoomSearch({
  checkIn,
  checkOut,
  guests,
  category,
  categories,
  onChange,
  onSearch,
}) {
  return (
    <form className="room-search-bar" onSubmit={(event) => { event.preventDefault(); onSearch?.(); }}>
      <label>
        Check-in
        <input type="date" value={checkIn} onChange={(e) => onChange?.("checkIn", e.target.value)} />
      </label>
      <label>
        Check-out
        <input type="date" value={checkOut} onChange={(e) => onChange?.("checkOut", e.target.value)} />
      </label>
      <label>
        Guests
        <input type="number" min="1" max="8" value={guests} onChange={(e) => onChange?.("guests", e.target.value)} />
      </label>
      <label>
        Category
        <select value={category} onChange={(e) => onChange?.("category", e.target.value)}>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <button type="submit">Search Rooms</button>
    </form>
  );
}
