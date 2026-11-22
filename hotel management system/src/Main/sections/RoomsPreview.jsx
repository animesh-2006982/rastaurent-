import React from "react";

export default function RoomsPreview({ nav }) {
  return (
    <section className="modular-section modular-rooms-preview">
      <span className="modular-eyebrow">STAY</span>
      <h2>Day for dining.<br />Night for staying.</h2>
      <p>Explore room categories, check availability and reserve your stay.</p>
      <button type="button" onClick={() => nav?.("rooms")}>Explore Rooms →</button>
    </section>
  );
}
