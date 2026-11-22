"use client";

import { useState } from "react";
import {
  PageHeader, SectionCard, StatCard, StatusBadge, Modal, currency,
} from "../../components/operations/OperationsUI";
import styles from "../../components/operations/operations.module.css";

const sections = [
  ["Employees", "Manage staff profiles, roles and attendance.", "18"],
  ["Inventory", "Track stock, low-stock items and wastage.", "48"],
  ["Menu", "Manage food items, categories and pricing.", "36"],
  ["Customers", "Review customer profiles and order history.", "1,284"],
  ["Reports", "View sales, payments and operational reports.", "12"],
  ["Settings", "Restaurant profile and POS preferences.", "—"],
];

const staff = [
  ["Rahul Das", "Cashier", "CT-102", "Active"],
  ["Amit Kumar", "Waiter", "CT-103", "Active"],
  ["Priya Devi", "Manager", "CT-104", "Active"],
  ["Rohan Dey", "Delivery", "CT-106", "Inactive"],
];

export default function ManagerPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <main className={styles.page}>
      <PageHeader eyebrow="MANAGER WORKSPACE" title="Manager"
        description="A central workspace for restaurant operations and staff management."
        action={<button type="button" className={styles.primaryButton} onClick={() => setSelected("Add Staff")}>+ Add Staff</button>} />
      <div className={styles.statsGrid4}>
        <StatCard label="Today Sales" value={currency(24850)} note="+12% from yesterday" tone="brown" />
        <StatCard label="Orders" value="128" note="+8% from yesterday" tone="green" />
        <StatCard label="Active Tables" value="12" note="4 occupied" tone="orange" />
        <StatCard label="Staff Online" value="8" note="2 in kitchen" tone="blue" />
      </div>
      <div className={styles.managerGrid}>
        {sections.map(([title, text, value]) => (
          <button key={title} type="button" className={styles.managerCard} onClick={() => setSelected(title)}>
            <div className={styles.managerIcon}>{title.slice(0, 1)}</div>
            <div><strong>{title}</strong><p>{text}</p></div>
            <span>{value}</span>
          </button>
        ))}
      </div>
      <SectionCard title="Staff Management" subtitle="Current restaurant staff">
        <div className={styles.staffGrid}>
          {staff.map(([name, role, id, status]) => (
            <div key={id} className={styles.staffCard}>
              <div className={styles.avatar}>{name.split(" ").map((n) => n[0]).join("")}</div>
              <div className={styles.staffDetails}><strong>{name}</strong><span>{role} · {id}</span></div>
              <StatusBadge tone={status === "Active" ? "green" : "red"}>{status}</StatusBadge>
            </div>
          ))}
        </div>
      </SectionCard>
      {selected && <Modal title={selected} onClose={() => setSelected(null)}>
        <div className={styles.modalBody}>
          <p>This workspace is prepared for Firebase/service integration in Message 3.</p>
          <button type="button" className={styles.primaryButton} onClick={() => setSelected(null)}>Close</button>
        </div>
      </Modal>}
    </main>
  );
}
