"use client";

import type { OrderItem as OrderItemType } from "@/types/order";

import { useCart } from "@/context/CartContext";

interface Props {
  item: OrderItemType;
}

export default function OrderItem({
  item,
}: Props) {
  const {
    increaseItem,
    decreaseItem,
    removeItem,
  } = useCart();

  return (
    <div className="ct-order-item">
      <div className="ct-order-item-image">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
          />
        ) : (
          "🍽"
        )}
      </div>

      <div className="ct-order-item-info">
        <strong>{item.name}</strong>

        {item.modifiers.length > 0 && (
          <small>
            {item.modifiers
              .map(
                (modifier) =>
                  modifier.name,
              )
              .join(", ")}
          </small>
        )}

        <span>
          ₹{item.price * item.quantity}
        </span>
      </div>

      <div className="ct-qty">
        <button
          onClick={() =>
            decreaseItem(item.id)
          }
        >
          −
        </button>

        <strong>{item.quantity}</strong>

        <button
          onClick={() =>
            increaseItem(item.id)
          }
        >
          +
        </button>
      </div>

      <button
        className="ct-delete"
        onClick={() =>
          removeItem(item.id)
        }
      >
        ×
      </button>
    </div>
  );
}