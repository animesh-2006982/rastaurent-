"use client";

import { useMemo, useState } from "react";
import {
  Armchair,
  CheckCircle2,
  Clock3,
  Users,
} from "lucide-react";
import StaffLayout from "@/components/layout/StaffLayout";
import styles from "@/styles/operations.module.css";
import { useRestaurant } from "@/context/RestaurantContext";

type TableStatus =
  | "Available"
  | "Occupied"
  | "Reserved";

export default function TablesPage() {
  const { tables } = useRestaurant();

  const [filter, setFilter] = useState<
    "All" | TableStatus
  >("All");

  const visible = useMemo(
    () =>
      tables.filter(
        (table) =>
          filter === "All" ||
          table.status === filter
      ),
    [tables, filter]
  );

  return (
    <StaffLayout active="Tables">
      <div className={styles.page}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Tables</h1>
            <p>
              Monitor table availability and seating
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className={styles.gridThree}>
          <div className={styles.statCard}>
            <div className={styles.quickIcon}>
              <CheckCircle2 size={20} />
            </div>

            <span>Available</span>

            <strong>
              {
                tables.filter(
                  (t) =>
                    t.status === "Available"
                ).length
              }
            </strong>
          </div>

          <div className={styles.statCard}>
            <div className={styles.quickIcon}>
              <Users size={20} />
            </div>

            <span>Occupied</span>

            <strong>
              {
                tables.filter(
                  (t) =>
                    t.status === "Occupied"
                ).length
              }
            </strong>
          </div>

          <div className={styles.statCard}>
            <div className={styles.quickIcon}>
              <Clock3 size={20} />
            </div>

            <span>Reserved</span>

            <strong>
              {
                tables.filter(
                  (t) =>
                    t.status === "Reserved"
                ).length
              }
            </strong>
          </div>
        </div>

        {/* FILTER */}
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            {(
              [
                "All",
                "Available",
                "Occupied",
                "Reserved",
              ] as const
            ).map((item) => (
              <button
                key={item}
                className={`${styles.tab} ${
                  filter === item
                    ? styles.tabActive
                    : ""
                }`}
                onClick={() =>
                  setFilter(item)
                }
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE GRID */}
        <div className={styles.tableGrid}>
          {visible.map((table) => {
            const cardClass =
              table.status === "Occupied"
                ? styles.tableCardOccupied
                : table.status === "Reserved"
                  ? styles.tableCardReserved
                  : "";

            const statusClass =
              table.status === "Occupied"
                ? styles.statusPreparing
                : table.status === "Reserved"
                  ? styles.statusNew
                  : styles.statusActive;

            return (
              <div
                className={`${styles.tableCard} ${cardClass}`}
                key={table.id}
              >
                <div
                  className={
                    styles.tableNumber
                  }
                >
                  T-
                  {String(
                    table.number
                  ).padStart(2, "0")}
                </div>

                <div
                  className={
                    styles.tableSeats
                  }
                >
                  <Armchair size={16} />

                  {table.seats} Seats
                </div>

                <span
                  className={`${styles.status} ${statusClass}`}
                >
                  {table.status}
                </span>

                <button
                  className={
                    styles.secondaryButton
                  }
                  type="button"
                >
                  {table.status ===
                  "Reserved"
                    ? "Seat Table"
                    : table.status ===
                        "Occupied"
                      ? "Free Table"
                      : "Occupy Table"}
                </button>
              </div>
            );
          })}

          {/* EMPTY STATE */}
          {visible.length === 0 && (
            <div
              style={{
                gridColumn:
                  "1 / -1",
                textAlign: "center",
                padding: "40px",
                opacity: 0.7,
              }}
            >
              No tables found.
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}