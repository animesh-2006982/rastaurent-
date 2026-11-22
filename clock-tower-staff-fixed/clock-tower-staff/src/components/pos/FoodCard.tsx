"use client";

import { useState } from "react";
import type { FoodItem } from "@/types/menu";
import { useCart } from "@/context/CartContext";
import ModifierModal from "./ModifierModal";

export default function FoodCard({ food }: { food: FoodItem }) {
  const { addItem } = useCart();
  const [modifierOpen, setModifierOpen] = useState(false);

  function addDefault() {
    if (food.modifiers.length) setModifierOpen(true);
    else addItem(food);
  }

  return (
    <>
      <article className="ct-food-card">
        <div className="ct-food-image-wrap">
          <img src={food.image} alt={food.name} className="ct-food-image" />
          {!food.available && <span className="ct-food-unavailable">Unavailable</span>}
        </div>
        <div className="ct-food-info">
          <div>
            <h4>{food.name}</h4>
            <p>{food.description}</p>
          </div>
          <div className="ct-food-bottom">
            <strong>₹{food.discountPrice ?? food.price}</strong>
            {food.discountPrice && <del>₹{food.price}</del>}
            <button disabled={!food.available} onClick={addDefault} className="ct-add-food">+</button>
          </div>
        </div>
      </article>
      <ModifierModal
        open={modifierOpen}
        onClose={() => setModifierOpen(false)}
        food={food}
      />
    </>
  );
}
