import React, { useEffect, useState } from "react";
import { getRoomBookings, updateRoomBooking } from "../../services/roomBookingService";
import { getRooms, updateRoom } from "../../services/roomService";
import "./room.css";

export default function CheckIn() {
  const [bookings,setBookings]=useState([]);
  const load=async()=>{try{setBookings((await getRoomBookings()).filter(b=>["Confirmed","Pending"].includes(b.status)))}catch(e){console.error(e)}};
  useEffect(()=>{load()},[]);
  const checkIn=async(b)=>{try{await updateRoomBooking(b.id,{status:"Checked In"});const rooms=await getRooms();const room=rooms.find(r=>String(r.roomNumber)===String(b.roomNumber));if(room)await updateRoom(room.id,{status:"Occupied"});await load();}catch(e){console.error(e);alert("Check-in failed.")}};
  return <section className="room-page"><div className="room-page-head"><div><span className="room-eyebrow">FRONT DESK</span><h1>Check-in</h1><p>Confirm arrivals and mark the assigned room as occupied.</p></div></div><div className="room-card-grid">{bookings.map(b=><div className="category-card compact-card" key={b.id}><div className="category-body"><div className="category-title-row"><h3>{b.guestName||"Guest"}</h3><span className="room-badge status-confirmed">{b.status}</span></div><p>Room #{b.roomNumber||"—"} • {b.checkIn||"—"} to {b.checkOut||"—"}</p><div className="category-meta"><span>👤 {b.guests||2}</span><span>📞 {b.phone||"—"}</span></div><button className="room-btn room-btn-primary" onClick={()=>checkIn(b)}>Check In</button></div></div>)}</div>{!bookings.length&&<div className="room-empty room-panel">No pending arrivals.</div>}</section>;
}
