
"use client";

import { useEffect, useState } from "react";

import { subscribeCollection } from "@/firebase/firestore";

import {
  updateOrderStatus,
} from "@/services/orderService";

import type {
  OrderItem,
  OrderStatus,
  RestaurantOrder,
} from "@/types/order";

type OrderDocument = Record<string, any> & {
  id: string;
};

function normalizeOrder(
  raw: OrderDocument
): RestaurantOrder {
  const customerObject =
    raw.customer && typeof raw.customer === "object"
      ? raw.customer
      : null;

  const rawItems = Array.isArray(raw.items)
    ? raw.items
    : [];

  const items: OrderItem[] = rawItems.map(
    (item: any) => {
      const quantity = Number(
        item.quantity ?? item.qty ?? 1
      );

      const price = Number(item.price || 0);

      return {
        ...item,

        menuItemId:
          item.menuItemId ||
          item.productId ||
          item.id ||
          "",

        productId:
          item.productId ||
          item.menuItemId ||
          item.id ||
          "",

        name: String(
          item.name || item.title || "Menu item"
        ),

        quantity,
        qty: quantity,
        price,

        total: Number(
          item.total ?? price * quantity
        ),
      };
    }
  );

  const order: RestaurantOrder = {
    ...raw,

    id: raw.id,

    orderNumber: String(
      raw.orderNumber ||
      raw.recordId ||
      raw.id
    ),

    customerName: String(
      raw.customerName ||
      customerObject?.name ||
      raw.customer ||
      "Guest"
    ),

    customerPhone: String(
      raw.customerPhone ||
      customerObject?.phone ||
      raw.phone ||
      ""
    ),

    tableId: String(
      raw.tableId || raw.table || ""
    ),

    tableNumber: String(
      raw.tableNumber || raw.table || ""
    ),

    orderType: (
      raw.orderType ||
      raw.type ||
      "Delivery"
    ) as any,

    items,

    subtotal: Number(raw.subtotal || 0),
    tax: Number(raw.tax || 0),
    discount: Number(raw.discount || 0),

    total: Number(
      raw.total ?? raw.due ?? 0
    ),

    status: String(
      raw.status || "New"
    ) as OrderStatus,

    paymentStatus:
      raw.paymentStatus ||
      (raw.paymentConfirmed ? "Paid" : "Pending"),
  };

  return order;
}

function timestampValue(value: any): number {
  if (value?.toMillis) {
    return value.toMillis();
  }

  if (value?.seconds) {
    return value.seconds * 1000;
  }

  if (typeof value === "string") {
    return Date.parse(value) || 0;
  }

  return 0;
}

export function useOrders() {
  const [orders, setOrders] =
    useState<RestaurantOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const unsubscribe =
      subscribeCollection<OrderDocument>(
        "orders",

        (documents) => {
          const normalized = documents
            .map(normalizeOrder)
            .sort(
              (a, b) =>
                timestampValue(b.createdAt) -
                timestampValue(a.createdAt)
            );

          setOrders(normalized);
          setLoading(false);
          setError(null);
        },

        [],

        (err) => {
          console.error(
            "Staff orders subscription failed:",
            err
          );

          setError(
            err.message ||
            "Unable to load orders from Firebase."
          );

          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  async function changeStatus(
    id: string,
    status: OrderStatus
  ) {
    await updateOrderStatus(id, status);
  }

  return {
    orders,
    loading,
    error,
    changeStatus,
  };
}
