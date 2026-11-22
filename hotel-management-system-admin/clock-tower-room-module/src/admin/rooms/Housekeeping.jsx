import React, { useEffect, useState } from "react";
import { getRooms, updateRoom } from "../../services/roomService";
import "./room.css";

const states=["Cleaning","Available","Maintenance","Out of Service"];
export default function Housekeeping(){
  const [rooms,setRooms]=useState([]);
  const load=async()=>{try{setRooms(await getRooms())}catch(e){console.error(e)}};
  useEffect(()=>{load()},[]);
  const update=async(id,status)=>{try{await updateRoom(id,{status});await load()}catch(e){console.error(e)}};
  return <section className="room-page"><div className="room-page-head"><div><span className="room-eyebrow">OPERATIONS</span><h1>Housekeeping</h1><p>Track cleaning, maintenance and room readiness.</p></div></div><div className="room-panel"><div className="availability-grid">{rooms.map(r=><div className="availability-card" key={r.id}><div><b>#{r.roomNumber||r.id}</b><span>{r.categoryName||"Room"}</span></div><div className="housekeeping-actions">{states.map(s=><button key={s} className={`mini-status ${r.status===s?"active":""}`} onClick={()=>update(r.id,s)}>{s}</button>)}</div></div>)}</div>{!rooms.length&&<div className="room-empty">No rooms configured.</div>}</div></section>;
}
