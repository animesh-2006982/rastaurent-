"use client";

import type { FoodCategory } from "@/types/menu";

interface Props {
  categories: FoodCategory[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategoryBar({
  categories,
  selected,
  onSelect,
}: Props) {
  return (
    <div className="ct-category-bar">
      {categories.map((category) => (
        <button
          key={category.id}
          className={
            selected === category.id
              ? "ct-category active"
              : "ct-category"
          }
          onClick={() =>
            onSelect(category.id)
          }
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}