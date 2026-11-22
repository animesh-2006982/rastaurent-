"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Modifier, FoodItem } from "@/types/menu";
import type { OrderItem } from "@/types/order";
import { calculateSubtotal, calculateTax, calculateTotal } from "@/lib/calculations";

type CartOrderType = "dine-in" | "takeaway" | "delivery" | "pre-order";

interface CartContextValue {
  items: OrderItem[];
  orderType: CartOrderType;
  setOrderType: (type: CartOrderType) => void;
  tableId: string | null;
  tableNumber: string | null;
  setTable: (id: string | null, number: string | null) => void;
  customerName: string;
  customerPhone: string;
  setCustomer: (name: string, phone: string) => void;
  addItem: (food: FoodItem, modifiers?: Modifier[]) => void;
  increaseItem: (id: string) => void;
  decreaseItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<CartOrderType>("dine-in");
  const [tableId, setTableId] = useState<string | null>("T02");
  const [tableNumber, setTableNumber] = useState<string | null>("T02");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");

  function addItem(food: FoodItem, modifiers: Modifier[] = []) {
    const modifierPrice = modifiers.reduce((sum, modifier) => sum + modifier.price, 0);
    const price = (food.discountPrice ?? food.price) + modifierPrice;
    const modifierKey = modifiers.map((modifier) => modifier.id).sort().join("-");
    const existing = items.find((item) => item.foodId === food.id && item.modifiers.map((modifier) => modifier.id).sort().join("-") === modifierKey);

    if (existing) {
      setItems((current) => current.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + 1, qty: item.quantity + 1 } : item));
      return;
    }

    const newItem: OrderItem = {
      id: `${food.id}-${Date.now()}`,
      foodId: food.id,
      name: food.name,
      price,
      quantity: 1,
      qty: 1,
      modifiers,
      image: food.image,
    };
    setItems((current) => [...current, newItem]);
  }

  function increaseItem(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1, qty: item.quantity + 1 } : item));
  }

  function decreaseItem(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity - 1, qty: item.quantity - 1 } : item).filter((item) => item.quantity > 0));
  }

  function removeItem(id: string) { setItems((current) => current.filter((item) => item.id !== id)); }

  function clearCart() {
    setItems([]);
    setTableId(null);
    setTableNumber(null);
    setCustomerName("Walk-in Customer");
    setCustomerPhone("");
  }

  function setTable(id: string | null, number: string | null) { setTableId(id); setTableNumber(number); }
  function setCustomer(name: string, phone: string) { setCustomerName(name); setCustomerPhone(phone); }

  const subtotal = useMemo(() => calculateSubtotal(items), [items]);
  const discount = 0;
  const tax = useMemo(() => calculateTax(subtotal - discount, 5), [subtotal]);
  const total = useMemo(() => calculateTotal(subtotal, discount, tax), [subtotal, tax]);

  return <CartContext.Provider value={{ items, orderType, setOrderType, tableId, tableNumber, setTable, customerName, customerPhone, setCustomer, addItem, increaseItem, decreaseItem, removeItem, clearCart, subtotal, discount, tax, total }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
