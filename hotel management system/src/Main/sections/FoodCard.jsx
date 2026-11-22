import React from "react";
import { getDishImage } from "../../data/menuData";

export default function FoodCard({ dish, onClick }) {
  return (
    <article className="modular-food-card" onClick={onClick}>
      <div className="modular-food-image">
        {getDishImage(dish) ? <img src={getDishImage(dish)} alt={dish.name} /> : <span>🍽️</span>}
      </div>
      <div>
        <span>{dish.category}</span>
        <h3>{dish.name}</h3>
        <p>{dish.desc}</p>
        <strong>₹{dish.price}</strong>
      </div>
    </article>
  );
}
