import React, { useEffect, useState } from "react";
import { getRoomBookings, updateRoomBooking } from "../../services/roomBookingService";
import "./room.css";

export default function RoomBookings() {
  const [items,setItems]=useState([]);
  const load=async()=>{try{setItems(await getRoomBookings())}catch(e){console.error(e)}};
  useEffect(()=>{load()},[]);
  const status=async(id,value)=>{try{await updateRoomBooking(id,{status:value});await load()}catch(e){console.error(e);alert("Could not update booking.")}};
  return <section className="room-page"><div className="room-page-head"><div><span className="room-eyebrow">ROOMS & STAY</span><h1>Room Bookings</h1><p>Manage reservations received from the public website and front desk.</p></div><button className="room-btn room-btn-outline" onClick={load}>↻ Refresh</button></div>
    <div className="room-panel"><div className="room-table-wrap"><table className="room-table"><thead><tr><th>Booking</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Guests</th><th>Amount</th><th>Status</th></tr></thead><tbody>{items.map(b=><tr key={b.id}><td>#{b.bookingId||b.id.slice(0,8)}</td><td>{b.guestName||"Guest"}<small>{b.phone||""}</small></td><td>{b.roomNumber||"—"}</td><td>{b.checkIn||"—"}</td><td>{b.checkOut||"—"}</td><td>{b.guests||2}</td><td>₹{Number(b.totalAmount||b.amount||0).toLocaleString("en-IN")}</td><td><select className="status-select" value={b.status||"Pending"} onChange={e=>status(b.id,e.target.value)}>{["Pending","Confirmed","Checked In","Checked Out","Cancelled","No Show"].map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div>{!items.length&&<div className="room-empty">No room bookings found.</div>}</div>
  </section>;
}
