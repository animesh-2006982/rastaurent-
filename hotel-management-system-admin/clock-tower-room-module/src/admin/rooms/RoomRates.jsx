import React, { useEffect, useState } from "react";
import { getRoomCategories, updateRoomCategory } from "../../services/roomCategoryService";
import "./room.css";

export default function RoomRates(){
  const [items,setItems]=useState([]);
  const load=async()=>{try{setItems(await getRoomCategories())}catch(e){console.error(e)}};
  useEffect(()=>{load()},[]);
  const save=async(item,value)=>{try{await updateRoomCategory(item.id,{price:Number(value||0)});await load()}catch(e){console.error(e);alert("Could not update rate.")}};
  return <section className="room-page"><div className="room-page-head"><div><span className="room-eyebrow">ROOMS & STAY</span><h1>Room Rates</h1><p>Manage the base nightly rate for each room category.</p></div></div><div className="room-panel"><div className="room-table-wrap"><table className="room-table"><thead><tr><th>Category</th><th>Guests</th><th>Bed</th><th>Base Rate / Night</th><th>Save</th></tr></thead><tbody>{items.map(item=><RateRow key={item.id} item={item} onSave={save}/>)}</tbody></table></div>{!items.length&&<div className="room-empty">No room categories found.</div>}</div></section>;
}
function RateRow({item,onSave}){const [value,setValue]=useState(item.price||0);return <tr><td><b>{item.name}</b></td><td>{item.maxGuests||2}</td><td>{item.bedType||"—"}</td><td><input className="inline-input" type="number" min="0" value={value} onChange={e=>setValue(e.target.value)}/></td><td><button className="table-action" onClick={()=>onSave(item,value)}>Save</button></td></tr>}
