"use client";

import { useMemo, useState } from "react";
import { Banknote, CreditCard, IndianRupee, Search, Smartphone } from "lucide-react";
import StaffLayout from "@/components/layout/StaffLayout";
import styles from "@/styles/operations.module.css";

type Method = "Cash" | "UPI" | "Card";

const initialPayments = [
  { id: "PAY-2048", order: "#1048", customer: "Walk-in", amount: 580, method: "UPI" as Method, time: "12:44 PM", status: "Paid" },
  { id: "PAY-2047", order: "#1047", customer: "Rahul", amount: 410, method: "Card" as Method, time: "12:34 PM", status: "Paid" },
  { id: "PAY-2046", order: "#1046", customer: "Ankit", amount: 330, method: "Cash" as Method, time: "12:22 PM", status: "Paid" },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState(initialPayments);
  const [method, setMethod] = useState<"All" | Method>("All");
  const [search, setSearch] = useState("");
  const [showPay, setShowPay] = useState(false);
  const [amount, setAmount] = useState("");

  const visible = useMemo(() => payments.filter((p) => {
    const q = search.toLowerCase();
    return (method === "All" || p.method === method) && `${p.id} ${p.order} ${p.customer}`.toLowerCase().includes(q);
  }), [payments, method, search]);

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  const iconFor = (m: Method) => m === "Cash" ? <Banknote size={19} /> : m === "UPI" ? <Smartphone size={19} /> : <CreditCard size={19} />;

  return (
    <StaffLayout active="Orders">
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}><h1>Payments</h1><p>Track collections and payment methods</p></div>
          <button className={styles.button} onClick={() => setShowPay(true)}><IndianRupee size={17} /> Record Payment</button>
        </div>

        <div className={styles.grid}>
          <div className={styles.statCard}><div className={styles.quickIcon}><IndianRupee size={20} /></div><span>Collected Today</span><strong>₹{total.toLocaleString("en-IN")}</strong><small>All methods</small></div>
          <div className={styles.statCard}><div className={styles.quickIcon}><Banknote size={20} /></div><span>Cash</span><strong>₹330</strong><small>1 transaction</small></div>
          <div className={styles.statCard}><div className={styles.quickIcon}><Smartphone size={20} /></div><span>UPI</span><strong>₹580</strong><small>1 transaction</small></div>
          <div className={styles.statCard}><div className={styles.quickIcon}><CreditCard size={20} /></div><span>Card</span><strong>₹410</strong><small>1 transaction</small></div>
        </div>

        <section className={styles.section}>
          <div className={styles.toolbar}>
            <div className={styles.search}><Search size={17} /><input className={styles.searchInput} placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className={styles.tabs}>{(["All", "Cash", "UPI", "Card"] as const).map((x) => <button key={x} className={`${styles.tab} ${method === x ? styles.tabActive : ""}`} onClick={() => setMethod(x)}>{x}</button>)}</div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Payment</th><th>Order</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{visible.map((p) => <tr key={p.id}><td><strong>{p.id}</strong><br /><small>{p.time}</small></td><td>{p.order}</td><td>{p.customer}</td><td><span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>{iconFor(p.method)}{p.method}</span></td><td>₹{p.amount}</td><td><span className={`${styles.status} ${styles.statusActive}`}>{p.status}</span></td></tr>)}</tbody>
            </table>
          </div>
        </section>

        {showPay && <div className={styles.modalOverlay}><div className={styles.modal}><div className={styles.sectionTitle}><span>Record Payment</span><button className={styles.secondaryButton} onClick={() => setShowPay(false)}>Close</button></div><label className={styles.label}>Amount</label><input className={styles.input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" /><label className={styles.label}>Method</label><select className={styles.select}><option>Cash</option><option>UPI</option><option>Card</option></select><button className={styles.button} onClick={() => { if (amount) setPayments((p) => [{ id: `PAY-${2050 + p.length}`, order: "Manual", customer: "Walk-in", amount: Number(amount), method: "Cash", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), status: "Paid" }, ...p]); setAmount(""); setShowPay(false); }}>Save Payment</button></div></div>}
      </div>
    </StaffLayout>
  );
}
