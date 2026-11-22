"use client";

import { useMemo, useState } from "react";
import {
  PageHeader, SearchBox, SectionCard, StatusBadge, StatCard, currency,
} from "../../components/operations/OperationsUI";
import styles from "../../components/operations/operations.module.css";

type Payment = {
  id: string; order: string; customer: string; method: string;
  amount: number; status: string; time: string;
};

const initialPayments: Payment[] = [
  { id: "PAY-1001", order: "#1042", customer: "Walk-in Customer", method: "Cash", amount: 651, status: "Paid", time: "18:42" },
  { id: "PAY-1000", order: "#1038", customer: "Rahul", method: "UPI", amount: 470, status: "Paid", time: "18:31" },
  { id: "PAY-999", order: "#1035", customer: "Ankit", method: "Card", amount: 420, status: "Paid", time: "18:25" },
  { id: "PAY-998", order: "#1031", customer: "Suman", method: "Cash", amount: 280, status: "Refunded", time: "18:10" },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState(initialPayments);
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("All");

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    return payments.filter((p) =>
      (!q || `${p.id} ${p.order} ${p.customer}`.toLowerCase().includes(q)) &&
      (method === "All" || p.method === method)
    );
  }, [payments, query, method]);

  const total = payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const cash = payments.filter((p) => p.status === "Paid" && p.method === "Cash").reduce((s, p) => s + p.amount, 0);
  const upi = payments.filter((p) => p.status === "Paid" && p.method === "UPI").reduce((s, p) => s + p.amount, 0);

  return (
    <main className={styles.page}>
      <PageHeader eyebrow="PAYMENTS & BILLING" title="Payments" description="Review transactions, payment methods and refunds."
        action={<SearchBox value={query} onChange={setQuery} placeholder="Search payment..." />} />
      <div className={styles.statsGrid4}>
        <StatCard label="Collected" value={currency(total)} note="Paid transactions" tone="green" />
        <StatCard label="Cash" value={currency(cash)} note="Cash payments" tone="brown" />
        <StatCard label="UPI" value={currency(upi)} note="Digital payments" tone="orange" />
        <StatCard label="Transactions" value={String(payments.length)} note="All records" tone="blue" />
      </div>
      <SectionCard title="Transactions" subtitle="Payment ledger"
        action={<select className={styles.select} value={method} onChange={(e) => setMethod(e.target.value)}>
          <option>All</option><option>Cash</option><option>UPI</option><option>Card</option><option>Split</option>
        </select>}>
        <div className={styles.orderTableWrap}>
          <table className={styles.dataTable}>
            <thead><tr><th>Payment</th><th>Order</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th><th>Time</th><th /></tr></thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.id}</strong></td><td>{p.order}</td><td>{p.customer}</td><td>{p.method}</td>
                  <td><strong>{currency(p.amount)}</strong></td>
                  <td><StatusBadge tone={p.status === "Paid" ? "green" : "red"}>{p.status}</StatusBadge></td>
                  <td>{p.time}</td>
                  <td>{p.status === "Paid" && <button className={styles.smallDanger} type="button" onClick={() => setPayments((all) => all.map((x) => x.id === p.id ? { ...x, status: "Refunded" } : x))}>Refund</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </main>
  );
}
