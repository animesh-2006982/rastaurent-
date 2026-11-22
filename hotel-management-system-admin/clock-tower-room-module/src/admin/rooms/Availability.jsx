import React, { useEffect, useState } from "react";
import { getRooms, updateRoom } from "../../services/roomService";
import "./room.css";

export default function Availability() {
  const [rooms,setRooms]=useState([]);
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const load=async()=>{try{setRooms(await getRooms())}catch(e){console.error(e)}};
  useEffect(()=>{load()},[]);
  const setStatus=async(room,status)=>{try{await updateRoom(room.id,{status});await load()}catch(e){console.error(e);alert("Could not update status.")}};
  return <section className="room-page"><div className="room-page-head"><div><span className="room-eyebrow">ROOMS & STAY</span><h1>Availability</h1><p>View and update operational room availability.</p></div><label className="date-control">Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div>
    <div className="room-panel"><div className="availability-grid">{rooms.map(r=><div className="availability-card" key={r.id}><div><b>#{r.roomNumber||r.id}</b><span>{r.categoryName||"Room"}</span></div><select value={r.status||"Available"} onChange={e=>setStatus(r,e.target.value)}>{["Available","Occupied","Reserved","Cleaning","Maintenance","Out of Service"].map(s=><option key={s}>{s}</option>)}</select></div>)}</div>{!rooms.length&&<div className="room-empty">No rooms available.</div>}</div>
  </section>;
}
