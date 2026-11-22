"use client";

import { useState } from "react";

import Modal from "@/components/common/Modal";

import Button from "@/components/common/Button";

import { useCart } from "@/context/CartContext";

interface Props {
  open: boolean;
  onClose: () => void;
  total?: number;
  onComplete?: () => void;
}

export default function PaymentModal({
  open,
  onClose,
  total: providedTotal,
  onComplete,
}: Props) {
  const cart = useCart();
  const total = providedTotal ?? cart.total;

  const [method, setMethod] =
    useState<
      "cash" | "upi" | "card"
    >("cash");

  const [received, setReceived] =
    useState("");

  const receivedAmount =
    Number(received) || 0;

  const change = Math.max(
    0,
    receivedAmount - total,
  );

  function completePayment() {
    if (
      method === "cash" &&
      receivedAmount < total
    ) {
      return;
    }

    alert(
      `Payment completed successfully.\nOrder #1042\nAmount: ₹${total}\nMethod: ${method.toUpperCase()}`,
    );

    if (providedTotal === undefined) cart.clearCart();
    onComplete?.();
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Payment — Order #1042"
      onClose={onClose}
    >
      <div className="ct-payment-total">
        <span>Total Amount</span>

        <strong>₹{total}</strong>
      </div>

      <div className="ct-payment-methods">
        {[
          ["cash", "💵 Cash"],
          ["upi", "📱 UPI"],
          ["card", "💳 Card"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={
              method === id
                ? "active"
                : ""
            }
            onClick={() =>
              setMethod(
                id as
                  | "cash"
                  | "upi"
                  | "card",
              )
            }
          >
            {label}
          </button>
        ))}
      </div>

      {method === "cash" && (
        <div className="ct-cash-section">
          <label>
            Customer Paid
          </label>

          <input
            type="number"
            min="0"
            value={received}
            onChange={(event) =>
              setReceived(
                event.target.value,
              )
            }
            placeholder={`₹${total}`}
          />

          <div className="ct-change">
            <span>Change</span>

            <strong>
              ₹{change}
            </strong>
          </div>
        </div>
      )}

      {method === "upi" && (
        <div className="ct-payment-message">
          <div>📱</div>
          <strong>
            UPI Payment
          </strong>
          <p>
            Collect ₹{total} from the
            customer through UPI.
          </p>
        </div>
      )}

      {method === "card" && (
        <div className="ct-payment-message">
          <div>💳</div>
          <strong>
            Card Payment
          </strong>
          <p>
            Process ₹{total} using the
            card machine.
          </p>
        </div>
      )}

      <div className="ct-modal-actions">
        <Button
          variant="secondary"
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button
          onClick={completePayment}
        >
          Complete Payment
        </Button>
      </div>
    </Modal>
  );
}