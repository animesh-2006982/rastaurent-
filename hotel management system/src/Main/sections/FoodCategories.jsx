import React from "react";

export default function FoodCategories({ products = [], onSelectCategory }) {
  const categories = ["All", ...new Set(products.map((item) => item.category).filter(Boolean))];

  return (
    <section className="modular-section">
      <span className="modular-eyebrow">CATEGORIES</span>
      <h2>Find your kind of craving.</h2>
      <div className="modular-pills">
        {categories.map((category) => (
          <button type="button" key={category} onClick={() => onSelectCategory?.(category)}>
            {category}
          </button>
        ))}
      </div>
    </section>
  );
}
