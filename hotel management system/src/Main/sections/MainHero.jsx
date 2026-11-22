import React from "react";

export default function MainHero({ hotel = {}, nav }) {
  return (
    <section id="home-section" className="modular-section modular-main-hero">
      <span className="modular-eyebrow">RESTAURANT · ROOMS</span>
      <h1>{hotel.name || "Your Restaurant"}</h1>
      <p>Good food downstairs. A comfortable room upstairs.</p>
      <div className="modular-actions">
        <button type="button" onClick={() => nav?.("order")}>Order Food</button>
        <button type="button" onClick={() => nav?.("rooms")}>Book a Room</button>
      </div>
    </section>
  );
}
