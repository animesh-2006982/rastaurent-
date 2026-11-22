"use client";

import { useMemo } from "react";
import styles from "./operations.module.css";

export const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export function PageHeader({
  eyebrow, title, description, action,
}: {
  eyebrow?: string; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className={styles.pageHeader}>
      <div>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className={styles.headerActions}>{action}</div>}
    </div>
  );
}

export function StatCard({
  label, value, note, tone = "brown",
}: {
  label: string; value: string; note?: string;
  tone?: "brown" | "green" | "red" | "orange" | "blue";
}) {
  return (
    <div className={`${styles.statCard} ${styles[tone]}`}>
      <span className={styles.statLabel}>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

export function StatusBadge({
  children, tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "orange" | "blue" | "neutral";
}) {
  return <span className={`${styles.badge} ${styles[`badge${tone}`]}`}>{children}</span>;
}

export function SearchBox({
  value, onChange, placeholder = "Search...",
}: {
  value: string; onChange: (value: string) => void; placeholder?: string;
}) {
  return (
    <label className={styles.searchBox}>
      <span>⌕</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function SectionCard({
  title, subtitle, children, action, className = "",
}: {
  title?: string; subtitle?: string; children: React.ReactNode;
  action?: React.ReactNode; className?: string;
}) {
  return (
    <section className={`${styles.card} ${className}`}>
      {(title || subtitle || action) && (
        <div className={styles.cardHeader}>
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tabs({
  items, value, onChange,
}: {
  items: string[]; value: string; onChange: (value: string) => void;
}) {
  return (
    <div className={styles.tabs}>
      {items.map((item) => (
        <button key={item} className={value === item ? styles.tabActive : ""} onClick={() => onChange(item)} type="button">
          {item}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  title, children, onClose,
}: {
  title: string; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button className={styles.iconButton} onClick={onClose} type="button">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const mockOrders = [
  { id: "#1042", table: "T02", type: "Dine In", customer: "Walk-in Customer", items: ["Chicken Biryani × 2", "Coke × 1", "French Fries × 1"], amount: 651, status: "New", age: "2 min ago" },
  { id: "#1038", table: "T04", type: "Dine In", customer: "Rahul", items: ["Chicken Pizza × 1", "Coke × 2"], amount: 470, status: "Preparing", age: "8 min ago" },
  { id: "#1035", table: "T01", type: "Dine In", customer: "Ankit", items: ["Veg Burger × 2", "French Fries × 1"], amount: 420, status: "Ready", age: "12 min ago" },
  { id: "#1032", table: "T03", type: "Dine In", customer: "Priya", items: ["Chicken Biryani × 1", "Coke × 2"], amount: 340, status: "Completed", age: "18:20" },
  { id: "#1031", table: "T08", type: "Takeaway", customer: "Suman", items: ["Mutton Biryani × 1"], amount: 280, status: "Completed", age: "18:10" },
];

export const mockTables = Array.from({ length: 12 }, (_, i) => {
  const number = i + 1;
  const occupied = [2, 6, 10].includes(number);
  const reserved = number === 4;
  return {
    id: `T${String(number).padStart(2, "0")}`,
    seats: [4, 4, 2, 6, 4, 4, 2, 4, 4, 6, 4, 2][i],
    status: occupied ? "Occupied" : reserved ? "Reserved" : "Available",
    amount: occupied ? [650, 1240, 560][[2, 6, 10].indexOf(number)] ?? 0 : 0,
  };
});

export function useFiltered<T>(items: T[], query: string, fields: (keyof T)[]) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      fields.some((field) => String(item[field] ?? "").toLowerCase().includes(q))
    );
  }, [items, query, fields]);
}
