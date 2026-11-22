"use client";

import { useMemo } from "react";
import { useOrders } from "./useOrders";

export function useKitchen() {
  const { orders, loading, changeStatus } = useOrders();

  const newOrders = useMemo(
    () => orders.filter((o) => o.status === "New"),
    [orders]
  );

  const preparingOrders = useMemo(
    () => orders.filter((o) => o.status === "Preparing"),
    [orders]
  );

  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === "Ready"),
    [orders]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "Completed"),
    [orders]
  );

  return {
    loading,
    newOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    changeStatus,
  };
}