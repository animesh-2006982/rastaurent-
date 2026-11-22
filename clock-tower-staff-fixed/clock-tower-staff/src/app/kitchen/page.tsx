
"use client";

import { useMemo, useState } from "react";

import {
  CheckCircle2,
  ChefHat,
  Clock3,
  Flame,
  PlayCircle,
} from "lucide-react";

import StaffLayout from "@/components/layout/StaffLayout";

import { useOrders } from "@/hooks/useOrders";

import type {
  OrderStatus,
  RestaurantOrder,
} from "@/types/order";

import styles from "@/styles/operations.module.css";

type KitchenStatus =
  | "New"
  | "Accepted"
  | "Preparing"
  | "Ready";

const columns: {
  key: KitchenStatus;
  label: string;
}[] = [
  { key: "New", label: "New Orders" },
  { key: "Accepted", label: "Accepted" },
  { key: "Preparing", label: "Preparing" },
  { key: "Ready", label: "Ready" },
];

function nextKitchenStatus(
  status: KitchenStatus
): OrderStatus | null {
  if (status === "New") return "Accepted";

  if (status === "Accepted") return "Preparing";

  if (status === "Preparing") return "Ready";

  return null;
}

export default function KitchenPage() {
  const {
    orders,
    loading,
    error,
    changeStatus,
  } = useOrders();

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const kitchenOrders = useMemo(
    () =>
      orders.filter((order) =>
        columns.some(
          (column) => column.key === order.status
        )
      ),
    [orders]
  );

  const counts = useMemo(
    () => ({
      New: kitchenOrders.filter(
        (order) => order.status === "New"
      ).length,

      Accepted: kitchenOrders.filter(
        (order) => order.status === "Accepted"
      ).length,

      Preparing: kitchenOrders.filter(
        (order) => order.status === "Preparing"
      ).length,

      Ready: kitchenOrders.filter(
        (order) => order.status === "Ready"
      ).length,
    }),
    [kitchenOrders]
  );

  async function advance(order: RestaurantOrder) {
    const next = nextKitchenStatus(
      order.status as KitchenStatus
    );

    if (!next) return;

    setSavingId(order.id);

    try {
      await changeStatus(order.id, next);
    } catch (err: any) {
      window.alert(
        err?.message ||
        "Could not update kitchen order."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <StaffLayout active="Kitchen">

      <div className={styles.page}>

        <div className={styles.header}>

          <div className={styles.headerLeft}>
            <h1>Kitchen</h1>

            <p>
              Live kitchen board connected to
              Admin and Website orders
            </p>
          </div>

          <div className={styles.headerActions}>
            <span
              className={`${styles.status} ${styles.statusActive}`}
            >
              <ChefHat size={15} />
              {kitchenOrders.length} Active Orders
            </span>
          </div>

        </div>

        {error && (
          <div className={styles.empty}>
            Firebase error: {error}
          </div>
        )}

        {loading && (
          <div className={styles.empty}>
            Loading kitchen orders…
          </div>
        )}

        <div className={styles.gridFour}>

          {columns.map((column) => (
            <div
              className={styles.statCard}
              key={column.key}
            >
              <div className={styles.quickIcon}>
                <Flame size={20} />
              </div>

              <span>{column.label}</span>

              <strong>{counts[column.key]}</strong>
            </div>
          ))}

        </div>

        {!loading && (
          <div className={styles.kitchenGrid}>

            {columns.map((column) => {

              const columnOrders =
                kitchenOrders.filter(
                  (order) =>
                    order.status === column.key
                );

              return (
                <div
                  className={`${
                    styles.kitchenColumn
                  } ${
                    column.key === "New"
                      ? styles.kitchenNew
                      : column.key === "Accepted" ||
                        column.key === "Preparing"
                      ? styles.kitchenPreparing
                      : styles.kitchenReady
                  }`}
                  key={column.key}
                >

                  <div className={styles.kitchenHeader}>
                    <span>{column.label}</span>
                    <strong>{columnOrders.length}</strong>
                  </div>

                  <div className={styles.kitchenBody}>

                    {columnOrders.map((order) => {

                      const next =
                        nextKitchenStatus(
                          order.status as KitchenStatus
                        );

                      return (
                        <div
                          className={styles.kitchenOrder}
                          key={order.id}
                        >

                          <div className={styles.orderCardHeader}>

                            <div>
                              <div className={styles.orderNumber}>
                                {order.orderNumber || order.id}
                              </div>

                              <div className={styles.orderTime}>
                                <Clock3 size={13} />

                                {order.customerName || "Guest"}
                                {" · "}
                                {order.tableNumber ||
                                  order.type ||
                                  "Online"}
                              </div>
                            </div>

                          </div>

                          <div className={styles.orderItems}>
                            {order.items.map(
                              (item, index) => (
                                <div
                                  key={`${order.id}-${index}`}
                                >
                                  {item.name}
                                  {" ×"}
                                  {item.quantity ||
                                    item.qty ||
                                    1}
                                </div>
                              )
                            )}
                          </div>

                          {next && (
                            <button
                              className={styles.button}
                              disabled={savingId === order.id}
                              onClick={() => advance(order)}
                            >
                              {savingId === order.id
                                ? "Saving…"
                                : column.key === "New"
                                ? (
                                  <>
                                    <PlayCircle size={16} />
                                    Accept Order
                                  </>
                                )
                                : column.key === "Accepted"
                                ? (
                                  <>
                                    <PlayCircle size={16} />
                                    Start Preparing
                                  </>
                                )
                                : (
                                  <>
                                    <CheckCircle2 size={16} />
                                    Mark Ready
                                  </>
                                )}
                            </button>
                          )}

                        </div>
                      );
                    })}

                    {columnOrders.length === 0 && (
                      <div className={styles.empty}>
                        No orders
                      </div>
                    )}

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
