"use client";

import { useMemo, useState } from "react";
import {
  PageHeader, SearchBox, SectionCard, StatusBadge, Tabs, mockOrders, currency,
} from "../../components/operations/OperationsUI";
import styles from "../../components/operations/operations.module.css";

export default function OrdersPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All");
  const tabs = ["All", "New", "Preparing", "Ready", "Completed"];

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    return orders.filter((o) =>
      (tab === "All" || o.status === tab) &&
      (!q || `${o.id} ${o.table} ${o.customer}`.toLowerCase().includes(q))
    );
  }, [orders, query, tab]);

  const cycleStatus = (id: string) => {
    const flow = ["New", "Preparing", "Ready", "Completed"];
    setOrders((current) => current.map((o) => {
      if (o.id !== id) return o;
      return { ...o, status: flow[(flow.indexOf(o.status) + 1) % flow.length] };
    }));
  };

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="ORDER MANAGEMENT"
        title="Orders"
        description="Track every order from creation to completion."
        action={<SearchBox value={query} onChange={setQuery} placeholder="Search order, table or customer..." />}
      />
      <SectionCard>
        <Tabs items={tabs} value={tab} onChange={setTab} />
        <div className={styles.orderTableWrap}>
          <table className={styles.dataTable}>
            <thead><tr><th>Order</th><th>Table</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.id}</strong><small>{order.age}</small></td>
                  <td>{order.table}<small>{order.type}</small></td>
                  <td>{order.customer}</td>
                  <td><div className={styles.itemStack}>{order.items.map((item) => <span key={item}>{item}</span>)}</div></td>
                  <td><strong>{currency(order.amount)}</strong></td>
                  <td><StatusBadge tone={order.status === "Completed" ? "green" : order.status === "New" ? "red" : order.status === "Ready" ? "blue" : "orange"}>{order.status}</StatusBadge></td>
                  <td><button type="button" className={styles.smallButton} onClick={() => cycleStatus(order.id)}>Next status</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <div className={styles.empty}>No matching orders.</div>}
        </div>
      </SectionCard>
    </main>
  );
}
