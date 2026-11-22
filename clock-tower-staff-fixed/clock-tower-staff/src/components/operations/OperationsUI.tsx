"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import styles from "./operations.module.css";

export const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {eyebrow && <div className={styles.sectionSubtitle}>{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className={styles.headerActions}>{action}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "brown" | "green" | "red" | "orange" | "blue";
}) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {note && <div className={styles.statMeta}>{note}</div>}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "green" | "red" | "orange" | "blue" | "neutral";
}) {
  const toneClass =
    tone === "green"
      ? styles.statusReady
      : tone === "red"
        ? styles.statusInactive
        : tone === "orange"
          ? styles.statusPreparing
          : tone === "blue"
            ? styles.statusActive
            : styles.statusCompleted;

  return <span className={`${styles.status} ${toneClass}`}>{children}</span>;
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className={styles.search}>
      <span className={styles.searchIcon} aria-hidden="true">
        ⌕
      </span>
      <input
        className={styles.searchInput}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
      />
    </label>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.card} ${className}`.trim()}>
      {(title || subtitle || action) && (
        <div className={styles.cardHeader}>
          <div>
            {title && <h2 className={styles.cardTitle}>{title}</h2>}
            {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.tabs} role="tablist">
      {items.map((item) => (
        <button
          key={item}
          className={`${styles.tab} ${value === item ? styles.tabActive : ""}`.trim()}
          onClick={() => onChange(item)}
          type="button"
          role="tab"
          aria-selected={value === item}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(30, 20, 15, 0.45)",
      }}
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={styles.card}
        style={{ width: "min(620px, 100%)", maxHeight: "90vh", overflow: "auto" }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{title}</h2>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const mockOrders = [
  {
    id: "#1042",
    table: "T02",
    type: "Dine In",
    customer: "Walk-in Customer",
    items: ["Chicken Biryani × 2", "Coke × 1", "French Fries × 1"],
    amount: 651,
    status: "New",
    age: "2 min ago",
  },
  {
    id: "#1038",
    table: "T04",
    type: "Dine In",
    customer: "Rahul",
    items: ["Chicken Pizza × 1", "Coke × 2"],
    amount: 470,
    status: "Preparing",
    age: "8 min ago",
  },
  {
    id: "#1035",
    table: "T01",
    type: "Dine In",
    customer: "Ankit",
    items: ["Veg Burger × 2", "French Fries × 1"],
    amount: 420,
    status: "Ready",
    age: "12 min ago",
  },
  {
    id: "#1032",
    table: "T03",
    type: "Dine In",
    customer: "Priya",
    items: ["Chicken Biryani × 1", "Coke × 2"],
    amount: 340,
    status: "Completed",
    age: "18:20",
  },
  {
    id: "#1031",
    table: "T08",
    type: "Takeaway",
    customer: "Suman",
    items: ["Mutton Biryani × 1"],
    amount: 280,
    status: "Completed",
    age: "18:10",
  },
];

export const mockTables = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  const occupiedTables = [2, 6, 10];
  const occupied = occupiedTables.includes(number);
  const reserved = number === 4;
  const amounts = [650, 1240, 560];
  const occupiedIndex = occupiedTables.indexOf(number);

  return {
    id: `T${String(number).padStart(2, "0")}`,
    seats: [4, 4, 2, 6, 4, 4, 2, 4, 4, 6, 4, 2][index],
    status: occupied ? "Occupied" : reserved ? "Reserved" : "Available",
    amount: occupied ? amounts[occupiedIndex] ?? 0 : 0,
  };
});

export function useFiltered<T>(
  items: T[],
  query: string,
  fields: Array<keyof T>,
) {
  return useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter((item) =>
      fields.some((field) =>
        String(item[field] ?? "")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    );
  }, [items, query, fields]);
}
