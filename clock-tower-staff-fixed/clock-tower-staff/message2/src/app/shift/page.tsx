"use client";

import { useMemo, useState } from "react";
import {
  PageHeader, SectionCard, StatCard, StatusBadge, currency,
} from "../../components/operations/OperationsUI";
import styles from "../../components/operations/operations.module.css";

const staff = [
  { name: "Rahul Das", role: "Cashier", start: "09:00 AM", hours: "8h 42m", status: "Open" },
  { name: "Amit Kumar", role: "Waiter", start: "10:00 AM", hours: "7h 42m", status: "Open" },
  { name: "Priya Devi", role: "Manager", start: "09:30 AM", hours: "8h 12m", status: "Open" },
  { name: "Rohan Dey", role: "Delivery", start: "11:00 AM", hours: "6h 42m", status: "Closed" },
];

export default function ShiftPage() {
  const [shiftOpen, setShiftOpen] = useState(true);
  const [cash, setCash] = useState(5000);
  const [closing, setClosing] = useState("");
  const expected = useMemo(() => cash + 6850, [cash]);

  return (
    <main className={styles.page}>
      <PageHeader eyebrow="SHIFT MANAGEMENT" title="Shift"
        description="Control opening cash, staff shifts and closing reconciliation."
        action={<button type="button" className={shiftOpen ? styles.dangerButton : styles.primaryButton} onClick={() => setShiftOpen((v) => !v)}>
          {shiftOpen ? "Close Shift" : "Open Shift"}
        </button>} />
      <div className={styles.statsGrid4}>
        <StatCard label="Shift Status" value={shiftOpen ? "OPEN" : "CLOSED"} note="Current shift" tone={shiftOpen ? "green" : "red"} />
        <StatCard label="Opening Cash" value={currency(cash)} note="Cash drawer" tone="brown" />
        <StatCard label="Sales" value={currency(6850)} note="This shift" tone="orange" />
        <StatCard label="Expected Cash" value={currency(expected)} note="Opening + cash sales" tone="blue" />
      </div>
      <div className={styles.twoColumn}>
        <SectionCard title="Current shift" subtitle="Shift details and reconciliation">
          <div className={styles.formGrid}>
            <label>Shift name<input defaultValue="Morning Shift" /></label>
            <label>Opened by<input defaultValue="Rahul Das" /></label>
            <label>Opening time<input defaultValue="09:00 AM" /></label>
            <label>Opening cash<input type="number" value={cash} onChange={(e) => setCash(Number(e.target.value))} /></label>
          </div>
          <div className={styles.shiftSummary}>
            <div><span>Cash sales</span><strong>{currency(6850)}</strong></div>
            <div><span>Expected cash</span><strong>{currency(expected)}</strong></div>
            <div><span>Closing cash entered</span><strong>{closing ? currency(Number(closing)) : "—"}</strong></div>
          </div>
          <label className={styles.fullField}>Closing cash<input value={closing} onChange={(e) => setClosing(e.target.value)} placeholder="Enter closing cash" type="number" /></label>
          <button type="button" className={styles.primaryButton}>Save Reconciliation</button>
        </SectionCard>
        <SectionCard title="Staff attendance" subtitle="People currently assigned to this shift">
          <div className={styles.staffGrid}>
            {staff.map((person) => (
              <div className={styles.staffCard} key={person.name}>
                <div className={styles.avatar}>{person.name.split(" ").map((n) => n[0]).join("")}</div>
                <div className={styles.staffDetails}><strong>{person.name}</strong><span>{person.role} · {person.start} · {person.hours}</span></div>
                <StatusBadge tone={person.status === "Open" ? "green" : "neutral"}>{person.status}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
