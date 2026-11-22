"use client";
import { Check, ChefHat } from "lucide-react";
import type { Order } from "@/types/order";
export default function KitchenOrderCard({order,onNext}:{order:Order;onNext:()=>void}){const label=order.status==="New"?"Accept":order.status==="Preparing"?"Mark Ready":order.status==="Ready"?"Handed Over":"Completed";return <div className="kitchen-card"><div className="kitchen-card-head"><b>{order.id}</b><span>{order.createdAt}</span></div><small>Table {order.table} · {order.type}</small><div className="kitchen-items">{order.items.map(x=><div key={x.id}>{x.quantity} × {x.name}</div>)}</div>{order.status!=="Completed"&&<button className="ct-btn ct-btn-primary full" onClick={onNext}>{label}{order.status==="Ready"?<Check size={15}/>:<ChefHat size={15}/>}</button>}</div>}
