import React from "react";

export default function FinalCTA({ nav }) {
  return (
    <section className="modular-section modular-final-cta">
      <span className="modular-eyebrow">ONE DESTINATION</span>
      <h2>Eat. Stay. Remember.</h2>
      <div className="modular-actions">
        <button type="button" onClick={() => nav?.("order")}>Order Food</button>
        <button type="button" onClick={() => nav?.("rooms")}>Book a Room</button>
      </div>
    </section>
  );
}
