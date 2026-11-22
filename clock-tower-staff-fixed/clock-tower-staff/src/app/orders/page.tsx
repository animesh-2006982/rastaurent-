
"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";

import StaffLayout from "@/components/layout/StaffLayout";
import { useOrders } from "@/hooks/useOrders";

import type {
  OrderStatus,
  RestaurantOrder,
} from "@/types/order";

import styles from "@/styles/operations.module.css";

const FILTERS = [
  "All",
  "New",
  "Accepted",
  "Preparing",
  "Ready",
  "Out for Delivery",
  "Delivered",
  "Completed",
  "Cancelled",
] as const;

type Filter = typeof FILTERS[number];

function nextStatus(
  order: RestaurantOrder
): OrderStatus | null {
  switch (order.status) {
    case "New":
      return "Accepted";

    case "Accepted":
      return "Preparing";

    case "Preparing":
      return "Ready";

    case "Ready":
      return /delivery/i.test(
        String(order.type || order.orderType || "")
      )
        ? "Out for Delivery"
        : null;

    case "Out for Delivery":
      return "Delivered";

    default:
      return null;
  }
}

function orderItems(order: RestaurantOrder) {
  return order.items.map(
    (item, index) =>
      `${item.name} ×${item.quantity || item.qty || 1}`
  );
}

export default function OrdersPage() {
  const {
    orders,
    loading,
    error,
    changeStatus,
  } = useOrders();

  const [filter, setFilter] =
    useState<Filter>("All");

  const [search, setSearch] = useState("");

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const visible = useMemo(
    () =>
      orders.filter((order) => {
        const matchesFilter =
          filter === "All" ||
          order.status === filter;

        const query = search.toLowerCase();

        const searchable = `
          ${order.id}
          ${order.orderNumber}
          ${order.tableNumber}
          ${order.customerName}
          ${order.customerPhone}
        `.toLowerCase();

        return (
          matchesFilter &&
          searchable.includes(query)
        );
      }),
    [orders, filter, search]
  );

  async function advance(order: RestaurantOrder) {
    const next = nextStatus(order);

    if (!next) return;

    setSavingId(order.id);

    try {
      await changeStatus(order.id, next);
    } catch (err: any) {
      window.alert(
        err?.message ||
        "Could not update order status."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <StaffLayout active="Orders">
      <div className={styles.page}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Orders</h1>
            <p>
              Live orders shared with Admin and Website
            </p>
          </div>
        </div>

        <div className={styles.toolbar}>

          <div className={styles.search}>
            <Search size={17} />

            <input
              className={styles.searchInput}
              placeholder="Search order, table or customer..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className={styles.tabs}>
            {FILTERS.map((value) => (
              <button
                key={value}
                className={`${styles.tab} ${
                  filter === value
                    ? styles.tabActive
                    : ""
                }`}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>

        </div>

        {error && (
          <div className={styles.empty}>
            Firebase error: {error}
          </div>
        )}

        {loading && (
          <div className={styles.empty}>
            Loading live orders from Firebase…
          </div>
        )}

        {!loading && !error && (
          <div className={styles.orderGrid}>

            {visible.length === 0 && (
              <div className={styles.empty}>
                <ClipboardList size={34} />

                <strong>No orders found</strong>

                <span>
                  New website and POS orders will
                  appear here.
                </span>
              </div>
            )}

            {visible.map((order) => {
              const next = nextStatus(order);

              return (
                <div
                  className={styles.orderCard}
                  key={order.id}
                >

                  <div className={styles.orderCardHeader}>

                    <div>
                      <div className={styles.orderNumber}>
                        {order.orderNumber || order.id}
                      </div>

                      <div className={styles.orderTime}>
                        {order.customerName || "Guest"}
                        {" · "}
                        {order.tableNumber ||
                          order.type ||
                          "Online"}
                      </div>
                    </div>

                    <span
                      className={`${styles.status} ${
                        order.status === "New"
                          ? styles.statusNew
                          : order.status === "Preparing" ||
                            order.status === "Accepted"
                          ? styles.statusPreparing
                          : order.status === "Ready" ||
                            order.status === "Out for Delivery"
                          ? styles.statusReady
                          : styles.statusCompleted
                      }`}
                    >
                      {order.status}
                    </span>

                  </div>

                  <div className={styles.orderItems}>
                    {orderItems(order).map(
                      (item, index) => (
                        <div key={`${order.id}-${index}`}>
                          {item}
                        </div>
                      )
                    )}
                  </div>

                  <div className={styles.orderTotal}>
                    ₹
                    {Number(order.total || 0)
                      .toLocaleString("en-IN")}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >

                    {next && (
                      <button
                        className={styles.button}
                        disabled={savingId === order.id}
                        onClick={() => advance(order)}
                      >
                        {savingId === order.id
                          ? "Saving…"
                          : `Mark ${next}`}
                      </button>
                    )}

                    <span
                      className={styles.secondaryButton}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      {order.paymentStatus ||
                        "Payment pending"}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </StaffLayout>
  );
}
