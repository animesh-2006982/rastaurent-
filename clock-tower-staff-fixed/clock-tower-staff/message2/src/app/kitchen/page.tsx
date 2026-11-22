"use client";

import { useMemo, useState } from "react";
import {
  PageHeader, SearchBox, SectionCard, StatusBadge, mockOrders, currency,
} from "../../components/operations/OperationsUI";
import styles from "../../components/operations/operations.module.css";

export default function KitchenPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [station, setStation] = useState("All Stations");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return orders.filter((o) => {
      const search = !q || `${o.id} ${o.table} ${o.items.join(" ")}`.toLowerCase().includes(q);
      const stationMatch = station === "All Stations" || o.type === station;
      return search && stationMatch;
    });
  }, [orders, query, station]);

  const move = (id: string) => {
    const flow = ["New", "Preparing", "Ready", "Completed"];
    setOrders((all) => all.map((o) => {
      if (o.id !== id) return o;
      return { ...o, status: flow[(flow.indexOf(o.status) + 1) % flow.length] };
    }));
  };

  const columns = [
    { title: "New Orders", status: "New", tone: "red" as const, action: "Accept" },
    { title: "Preparing", status: "Preparing", tone: "orange" as const, action: "Mark Ready" },
    { title: "Ready", status: "Ready", tone: "green" as const, action: "Handed Over" },
    { title: "Completed", status: "Completed", tone: "blue" as const, action: "" },
  ];

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="KITCHEN DISPLAY SYSTEM"
        title="Kitchen"
        description="Manage incoming orders, preparation and handover from one screen."
        action={
          <div className={styles.headerTools}>
            <SearchBox value={query} onChange={setQuery} placeholder="Search order..." />
            <select value={station} onChange={(e) => setStation(e.target.value)} className={styles.select}>
              <option>All Stations</option><option>Dine In</option><option>Takeaway</option>
            </select>
          </div>
        }
      />

      <div className={styles.kitchenBoard}>
        {columns.map((column) => {
          const list = filtered.filter((o) => o.status === column.status);
          return (
            <section key={column.status} className={`${styles.kanbanColumn} ${styles[`column${column.tone}`]}`}>
              <div className={styles.kanbanHeader}>
                <div><h2>{column.title}</h2><span>{list.length} orders</span></div>
                <span className={styles.countPill}>{list.length}</span>
              </div>
              <div className={styles.kanbanList}>
                {list.length === 0 && <div className={styles.kanbanEmpty}>No orders here</div>}
                {list.map((order) => (
                  <article key={order.id} className={styles.kitchenOrder}>
                    <div className={styles.orderTop}>
                      <strong>{order.id}</strong>
                      <StatusBadge tone={column.tone}>{order.age}</StatusBadge>
                    </div>
                    <div className={styles.orderMeta}><span>Table {order.table}</span><span>{order.type}</span></div>
                    <div className={styles.orderItems}>{order.items.map((item) => <div key={item}>• {item}</div>)}</div>
                    <div className={styles.orderBottom}>
                      <strong>{currency(order.amount)}</strong>
                      {column.action && <button type="button" className={styles.primaryButton} onClick={() => move(order.id)}>{column.action}</button>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <SectionCard title="Kitchen summary" subtitle="Live operational snapshot">
        <div className={styles.statsGrid}>
          {["New", "Preparing", "Ready", "Completed"].map((status) => (
            <div className={styles.miniStat} key={status}>
              <span>{status}</span><strong>{orders.filter((o) => o.status === status).length}</strong>
            </div>
          ))}
        </div>
      </SectionCard>
    </main>
  );
}
