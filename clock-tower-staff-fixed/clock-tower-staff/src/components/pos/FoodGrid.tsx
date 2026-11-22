"use client";

import type { FoodItem } from "@/types/menu";

import FoodCard from "./FoodCard";

interface Props {
  foods: FoodItem[];
  category: string;
  search: string;
}

export default function FoodGrid({
  foods,
  category,
  search,
}: Props) {
  const filtered = foods.filter(
    (food) => {
      const categoryMatch =
        category === "all" ||
        food.categoryId === category;

      const searchMatch =
        food.name
          .toLowerCase()
          .includes(
            search.toLowerCase(),
          );

      return categoryMatch && searchMatch;
    },
  );

  if (!filtered.length) {
    return (
      <div className="ct-empty-food">
        <div>🍽️</div>
        <strong>
          No food items found
        </strong>
        <p>
          Try another category or search.
        </p>
      </div>
    );
  }

  return (
    <div className="ct-food-grid">
      {filtered.map((food) => (
        <FoodCard
          key={food.id}
          food={food}
        />
      ))}
    </div>
  );
}