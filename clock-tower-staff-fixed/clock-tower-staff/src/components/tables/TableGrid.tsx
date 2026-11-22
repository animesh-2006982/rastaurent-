"use client";
import { useState } from "react";
import { tables } from "@/data/mock";
import TableCard from "./TableCard";
export default function TableGrid(){const[selected,setSelected]=useState("T02");return <><div className="table-filter"><button className="selected">All (12)</button><button>Available (7)</button><button>Occupied (4)</button><button>Reserved (1)</button></div><div className="table-grid">{tables.map(t=><TableCard key={t.id} table={t} onClick={()=>setSelected(t.id)}/>)}</div><div className="selected-table">Selected Table: <b>{selected}</b></div></>}
