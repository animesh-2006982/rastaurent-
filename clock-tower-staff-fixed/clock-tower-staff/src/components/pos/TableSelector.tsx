"use client";

import type { RestaurantTable } from "@/types/table";
import { useCart } from "@/context/CartContext";

export default function TableSelector({ tables }: { tables: RestaurantTable[] }) {
  const { tableId, setTable, orderType } = useCart();
  if (orderType !== "dine-in") return null;

  return <div className="ct-selector-box">
    <div className="ct-section-title"><strong>Table</strong><span>{tableId ? "Selected" : "Select table"}</span></div>
    <div className="ct-table-mini-grid">
      {tables.map((table) => {
        const selected = table.id === tableId;
        const disabled = table.status !== "Available" && !selected;
        return <button key={table.id} disabled={disabled} className={["ct-mini-table", selected ? "selected" : "", table.status.toLowerCase()].join(" ")} onClick={() => setTable(table.id, table.number)}>
          <strong>{table.number}</strong><small>{table.capacity} seats</small>
        </button>;
      })}
    </div>
  </div>;
}
