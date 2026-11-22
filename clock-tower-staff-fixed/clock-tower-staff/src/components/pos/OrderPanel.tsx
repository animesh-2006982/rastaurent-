"use client";

import { useState } from "react";

import { useCart } from "@/context/CartContext";

import OrderItem from "./OrderItem";

import TableSelector from "./TableSelector";

import CustomerSelector from "./CustomerSelector";

import PaymentModal from "./PaymentModal";

import type { RestaurantTable } from "@/types/table";

interface Props {
  tables: RestaurantTable[];
}

export default function OrderPanel({
  tables,
}: Props) {
  const {
    items,
    orderType,
    setOrderType,
    subtotal,
    discount,
    tax,
    total,
    clearCart,
    tableNumber,
  } = useCart();

  const [paymentOpen, setPaymentOpen] =
    useState(false);

  const [sent, setSent] =
    useState(false);

  function sendToKitchen() {
    if (!items.length) {
      return;
    }

    setSent(true);

    setTimeout(() => {
      setSent(false);
    }, 2500);
  }

  return (
    <aside className="ct-order-panel">
      <div className="ct-order-header">
        <div>
          <h3>Current Order</h3>

          <span>
            {items.length} item
            {items.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        <button
          className="ct-clear"
          onClick={clearCart}
          disabled={!items.length}
        >
          Clear
        </button>
      </div>

      <div className="ct-order-types">
        {[
          ["dine-in", "Dine In"],
          ["takeaway", "Takeaway"],
          ["delivery", "Delivery"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={
              orderType === id
                ? "active"
                : ""
            }
            onClick={() =>
              setOrderType(
                id as
                  | "dine-in"
                  | "takeaway"
                  | "delivery",
              )
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ct-order-meta">
        <div className="ct-meta-chip">
          <span>Table</span>
          <strong>
            {orderType === "dine-in"
              ? tableNumber ?? "Select"
              : "—"}
          </strong>
        </div>

        <div className="ct-meta-chip">
          <span>Order</span>
          <strong>#1042</strong>
        </div>
      </div>

      <div className="ct-order-scroll">
        {items.length === 0 ? (
          <div className="ct-empty-order">
            <div>🛒</div>

            <strong>
              No items yet
            </strong>

            <p>
              Select food from the menu
              to start an order.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <OrderItem
              key={item.id}
              item={item}
            />
          ))
        )}

        <TableSelector tables={tables} />

        <CustomerSelector />
      </div>

      <div className="ct-order-summary">
        <div>
          <span>Subtotal</span>
          <strong>₹{subtotal}</strong>
        </div>

        <div>
          <span>Discount</span>
          <strong>
            −₹{discount}
          </strong>
        </div>

        <div>
          <span>Tax (5%)</span>
          <strong>₹{tax}</strong>
        </div>

        <div className="ct-total-row">
          <span>Total</span>
          <strong>₹{total}</strong>
        </div>

        {sent && (
          <div className="ct-kitchen-success">
            ✓ Order sent to kitchen
          </div>
        )}

        <div className="ct-order-actions">
          <button
            className="ct-secondary-action"
            disabled={!items.length}
            onClick={sendToKitchen}
          >
            Send to Kitchen
          </button>

          <button
            className="ct-pay-action"
            disabled={!items.length}
            onClick={() =>
              setPaymentOpen(true)
            }
          >
            Proceed to Payment →
          </button>
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() =>
          setPaymentOpen(false)
        }
      />
    </aside>
  );
}