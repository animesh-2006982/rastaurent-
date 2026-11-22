"use client";

import { useMemo, useState } from "react";
import {
  PageHeader, SearchBox, SectionCard, StatusBadge, Modal, mockTables, currency,
} from "../../components/operations/OperationsUI";
import styles from "../../components/operations/operations.module.css";

type Table = (typeof mockTables)[number];

export default function TablesPage() {
  const [tables, setTables] = useState(mockTables);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Table | null>(null);

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    return tables.filter((t) =>
      (filter === "All" || t.status === filter) && (!q || t.id.toLowerCase().includes(q))
    );
  }, [tables, filter, query]);

  const counts = {
    All: tables.length,
    Available: tables.filter((t) => t.status === "Available").length,
    Occupied: tables.filter((t) => t.status === "Occupied").length,
    Reserved: tables.filter((t) => t.status === "Reserved").length,
  };

  const updateStatus = (status: string) => {
    if (!selected) return;
    setTables((all) => all.map((t) => t.id === selected.id ? { ...t, status } : t));
    setSelected(null);
  };

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="POS · TABLE MANAGEMENT"
        title="Tables"
        description="Monitor table availability and manage dine-in seating."
        action={<SearchBox value={query} onChange={setQuery} placeholder="Search table..." />}
      />

      <div className={styles.filterTabs}>
        {Object.keys(counts).map((key) => (
          <button key={key} type="button" className={filter === key ? styles.filterActive : ""} onClick={() => setFilter(key)}>
            {key} <span>{counts[key as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      <div className={styles.tableGrid}>
        {visible.map((table) => (
          <button
            key={table.id}
            type="button"
            className={`${styles.tableCard} ${
              table.status === "Available" ? styles.tableAvailable :
              table.status === "Occupied" ? styles.tableOccupied : styles.tableReserved
            }`}
            onClick={() => setSelected(table)}
          >
            <div className={styles.tableIcon}>▦</div>
            <strong>{table.id}</strong>
            <span>{table.seats} seats</span>
            <StatusBadge tone={table.status === "Available" ? "green" : table.status === "Occupied" ? "red" : "orange"}>{table.status}</StatusBadge>
            {table.amount > 0 && <small>{currency(table.amount)}</small>}
          </button>
        ))}
      </div>

      <SectionCard title="Table activity" subtitle="Occupied and reserved tables">
        <div className={styles.activityList}>
          {tables.filter((t) => t.status !== "Available").map((table) => (
            <div key={table.id} className={styles.activityRow}>
              <div><strong>{table.id}</strong><span>{table.seats} seats</span></div>
              <StatusBadge tone={table.status === "Occupied" ? "red" : "orange"}>{table.status}</StatusBadge>
              <span>{table.amount ? currency(table.amount) : "Reserved"}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {selected && (
        <Modal title={`Table ${selected.id}`} onClose={() => setSelected(null)}>
          <div className={styles.modalTableInfo}>
            <div className={styles.bigTable}>{selected.id}</div>
            <p>{selected.seats} seats · Current status: <strong>{selected.status}</strong></p>
          </div>
          <div className={styles.modalActions}>
            {["Available", "Occupied", "Reserved"].map((status) => (
              <button key={status} type="button" className={styles.secondaryButton} onClick={() => updateStatus(status)}>
                Set {status}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </main>
  );
}
