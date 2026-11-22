import React from "react";
import FoodCard from "./FoodCard";

export default function FoodMenu({ products = [], nav }) {
  const featured = products.filter((item) => item.available !== false).slice(0, 6);

  return (
    <section className="modular-section">
      <span className="modular-eyebrow">FOOD</span>
      <h2>Every plate has a place.</h2>
      <div className="modular-grid">
        {featured.map((item) => (
          <FoodCard key={item.id} dish={item} onClick={() => nav?.("order")} />
        ))}
      </div>
    </section>
  );
}
