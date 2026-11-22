"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";
import type { FoodItem, Modifier } from "@/types/menu";
import { useCart } from "@/context/CartContext";

export default function ModifierModal({ open, onClose, food }: { open: boolean; onClose: () => void; food?: FoodItem }) {
  const { addItem } = useCart();
  const [selected, setSelected] = useState<string[]>([]);
  const options: Modifier[] = food?.modifiers ?? [
    { id: "extra-chicken", name: "Extra Chicken", price: 80 },
    { id: "extra-egg", name: "Extra Egg", price: 20 },
    { id: "raita", name: "Raita", price: 30 },
    { id: "extra-rice", name: "Extra Rice", price: 40 },
  ];

  function apply() {
    if (food) addItem(food, options.filter((option) => selected.includes(option.id)));
    setSelected([]);
    onClose();
  }

  return <Modal open={open} onClose={onClose} title="Add-ons / Modifiers">
    <div className="modifier-list">
      {options.map((option) => <label key={option.id}>
        <input type="checkbox" checked={selected.includes(option.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, option.id] : current.filter((id) => id !== option.id))} />
        <span>{option.name}</span><b>+ ₹{option.price}</b>
      </label>)}
    </div>
    <button className="ct-btn ct-btn-primary full" onClick={apply}>Add to Order</button>
  </Modal>;
}
