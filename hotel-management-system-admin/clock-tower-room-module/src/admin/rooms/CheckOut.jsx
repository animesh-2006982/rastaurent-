import React, { useEffect, useState } from "react";
import { getRoomBookings, updateRoomBooking } from "../../services/roomBookingService";
import { getRooms, updateRoom } from "../../services/roomService";
import "./room.css";

export default function CheckOut() {
  const [bookings,setBookings]=useState([]);
  const load=async()=>{try{setBookings((await getRoomBookings()).filter(b=>b.status==="Checked In"))}catch(e){console.error(e)}};
  useEffect(()=>{load()},[]);
  const checkOut=async(b)=>{try{await updateRoomBooking(b.id,{status:"Checked Out"});const rooms=await getRooms();const room=rooms.find(r=>String(r.roomNumber)===String(b.roomNumber));if(room)await updateRoom(room.id,{status:"Cleaning"});await load();}catch(e){console.error(e);alert("Check-out failed.")}};
  return <section className="room-page"><div className="room-page-head"><div><span className="room-eyebrow">FRONT DESK</span><h1>Check-out</h1><p>Check out current guests and automatically send the room to cleaning.</p></div></div><div className="room-card-grid">{bookings.map(b=><div className="category-card compact-card" key={b.id}><div className="category-body"><div className="category-title-row"><h3>{b.guestName||"Guest"}</h3><span className="room-badge status-occupied">Checked In</span></div><p>Room #{b.roomNumber||"—"} • Checkout {b.checkOut||"—"}</p><div className="category-meta"><span>₹{Number(b.totalAmount||b.amount||0).toLocaleString("en-IN")}</span><span>👤 {b.guests||2}</span></div><button className="room-btn room-btn-primary" onClick={()=>checkOut(b)}>Check Out</button></div></div>)}</div>{!bookings.length&&<div className="room-empty room-panel">No guests currently checked in.</div>}</section>;
}
