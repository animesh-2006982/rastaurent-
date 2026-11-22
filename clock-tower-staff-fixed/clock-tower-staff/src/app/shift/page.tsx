"use client";

import { useMemo, useState } from "react";
import { Banknote, Clock3, LogIn, LogOut, RefreshCcw } from "lucide-react";
import StaffLayout from "@/components/layout/StaffLayout";
import styles from "@/styles/operations.module.css";

export default function ShiftPage() {
  const [open, setOpen] = useState(true);
  const [opening, setOpening] = useState("5000");
  const [cashSales, setCashSales] = useState("12850");
  const [cardSales] = useState("18400");
  const [expected, setExpected] = useState("17850");
  const [actual, setActual] = useState("17850");

  const difference = useMemo(() => Number(actual || 0) - Number(expected || 0), [actual, expected]);

  return (
    <StaffLayout active="Shift">
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}><h1>Shift</h1><p>Manage cashier shift and end-of-shift reconciliation</p></div>
          <span className={`${styles.status} ${open ? styles.statusActive : styles.statusInactive}`}>{open ? "Shift Active" : "Shift Closed"}</span>
        </div>

        <div className={styles.gridThree}>
          <div className={styles.card}><div className={styles.sectionTitle}><span>Shift Started</span><Clock3 size={18} /></div><strong>09:02 AM</strong><p>Rahul Das · Cashier</p></div>
          <div className={styles.card}><div className={styles.sectionTitle}><span>Opening Cash</span><Banknote size={18} /></div><strong>₹{Number(opening).toLocaleString("en-IN")}</strong><p>Drawer opening balance</p></div>
          <div className={styles.card}><div className={styles.sectionTitle}><span>Current Sales</span><RefreshCcw size={18} /></div><strong>₹{(Number(cashSales) + Number(cardSales)).toLocaleString("en-IN")}</strong><p>Cash + card/UPI</p></div>
        </div>

        <div className={styles.gridTwo}>
          <section className={styles.card}>
            <div className={styles.sectionTitle}><span>Cash Reconciliation</span><Banknote size={18} /></div>
            <label className={styles.label}>Opening Cash</label><input className={styles.input} value={opening} onChange={(e) => setOpening(e.target.value)} />
            <label className={styles.label}>Cash Sales</label><input className={styles.input} value={cashSales} onChange={(e) => setCashSales(e.target.value)} />
            <label className={styles.label}>Expected Cash</label><input className={styles.input} value={expected} onChange={(e) => setExpected(e.target.value)} />
            <label className={styles.label}>Actual Cash</label><input className={styles.input} value={actual} onChange={(e) => setActual(e.target.value)} />
          </section>

          <section className={styles.card}>
            <div className={styles.sectionTitle}><span>Reconciliation</span><RefreshCcw size={18} /></div>
            <div className={styles.reconciliation}>
              <div className={styles.reconciliationRow}><span className={styles.reconciliationLabel}>Expected</span><strong className={styles.reconciliationValue}>₹{Number(expected).toLocaleString("en-IN")}</strong></div>
              <div className={styles.reconciliationRow}><span className={styles.reconciliationLabel}>Actual</span><strong className={styles.reconciliationValue}>₹{Number(actual).toLocaleString("en-IN")}</strong></div>
              <div className={styles.reconciliationRow}><span className={styles.reconciliationLabel}>Difference</span><strong className={styles.reconciliationValue}>₹{difference.toLocaleString("en-IN")}</strong></div>
            </div>
            <button className={open ? styles.dangerButton : styles.button} onClick={() => setOpen(!open)}>{open ? <><LogOut size={17} /> Close Shift</> : <><LogIn size={17} /> Open Shift</>}</button>
          </section>
        </div>
      </div>
    </StaffLayout>
  );
}
