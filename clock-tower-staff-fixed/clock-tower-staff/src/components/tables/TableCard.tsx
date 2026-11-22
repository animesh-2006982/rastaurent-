"use client";
import type { RestaurantTable } from "@/types/table";
export default function TableCard({table,onClick}:{table:RestaurantTable;onClick:()=>void}){return <button onClick={onClick} className={`table-card ${table.status.toLowerCase()}`}><div><b>{table.id}</b><span>{table.seats} seats</span></div><strong>{table.status}</strong>{table.amount>0&&<small>₹{table.amount}</small>}</button>}
