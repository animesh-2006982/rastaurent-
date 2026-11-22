"use client";

import { useState } from "react";
import { sampleOrders } from "@/data/mock";
import type { Order, OrderStatus } from "@/types/order";
import KitchenOrderCard from "./KitchenOrderCard";

const columns: OrderStatus[] = ["New", "Preparing", "Ready", "Completed"];

function nextStatus(status: OrderStatus): OrderStatus {
  if (status === "New") return "Preparing";
  if (status === "Preparing") return "Ready";
  if (status === "Ready") return "Completed";
  return status;
}

export default function KitchenBoard() {
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  function advance(id: string) {
    setOrders((list) => list.map((order) => order.id === id ? { ...order, status: nextStatus(order.status) } : order));
  }
  return <div className="kitchen-board">
    {columns.map((column) => <section className="kitchen-column" key={column}>
      <div className="column-head"><b>{column}</b><span>{orders.filter((order) => order.status === column).length}</span></div>
      {orders.filter((order) => order.status === column).map((order) => <KitchenOrderCard key={order.id} order={order} onNext={() => advance(order.id)} />)}
    </section>)}
  </div>;
}
