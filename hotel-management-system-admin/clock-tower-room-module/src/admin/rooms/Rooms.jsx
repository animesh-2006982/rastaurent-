import React, { useEffect, useState } from "react";
import { getRooms, addRoom, updateRoom, deleteRoom } from "../../services/roomService";
import { getRoomCategories } from "../../services/roomCategoryService";
import "./room.css";

const empty = { roomNumber: "", categoryId: "", categoryName: "", floor: "", price: "", maxGuests: 2, bedType: "1 King Bed", status: "Available", image: "", notes: "" };

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [show, setShow] = useState(false);

  const load = async () => {
    try { const [r,c] = await Promise.all([getRooms(), getRoomCategories()]); setRooms(r); setCategories(c); } catch(e){ console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const category = categories.find(c => c.id === form.categoryId);
    const payload = { ...form, categoryName: category?.name || form.categoryName, price: Number(form.price || category?.price || 0), maxGuests: Number(form.maxGuests || category?.maxGuests || 2) };
    try {
      if (editing) await updateRoom(editing, payload); else await addRoom(payload);
      setShow(false); setEditing(null); setForm(empty); await load();
    } catch(e) { console.error(e); alert("Could not save room."); }
  };

  const edit = room => { setEditing(room.id); setForm({...empty,...room}); setShow(true); };
  const remove = async id => { if (!window.confirm("Delete this room?")) return; try { await deleteRoom(id); await load(); } catch(e){ console.error(e); alert("Could not delete room."); } };

  return (
    <section className="room-page">
      <div className="room-page-head"><div><span className="room-eyebrow">ROOMS & STAY</span><h1>Rooms</h1><p>Manage individual hotel rooms and their operational status.</p></div><button className="room-btn room-btn-primary" onClick={()=>{setEditing(null);setForm(empty);setShow(true)}}>+ Add Room</button></div>
      <div className="room-panel">
        <div className="room-table-wrap"><table className="room-table"><thead><tr><th>Room</th><th>Category</th><th>Floor</th><th>Guests</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{rooms.map(r=><tr key={r.id}><td><b>#{r.roomNumber || r.id}</b></td><td>{r.categoryName || "—"}</td><td>{r.floor || "—"}</td><td>{r.maxGuests || 2}</td><td>₹{Number(r.price||0).toLocaleString("en-IN")}</td><td><span className={`room-badge status-${(r.status||"Available").toLowerCase().replaceAll(" ","-")}`}>{r.status||"Available"}</span></td><td><button className="table-action" onClick={()=>edit(r)}>Edit</button><button className="table-action danger-text" onClick={()=>remove(r.id)}>Delete</button></td></tr>)}</tbody></table></div>
        {rooms.length===0 && <div className="room-empty">No rooms configured yet.</div>}
      </div>

      {show && <div className="room-modal-backdrop" onMouseDown={()=>setShow(false)}><div className="room-modal" onMouseDown={e=>e.stopPropagation()}>
        <div className="room-modal-head"><div><h2>{editing?"Edit Room":"Add Room"}</h2><p>Each room is an individual inventory unit.</p></div><button className="modal-close" onClick={()=>setShow(false)}>×</button></div>
        <form className="room-form" onSubmit={submit}>
          <div className="form-two"><label>Room Number<input value={form.roomNumber} onChange={e=>setForm({...form,roomNumber:e.target.value})} placeholder="101" required /></label><label>Floor<input value={form.floor} onChange={e=>setForm({...form,floor:e.target.value})} placeholder="1st Floor" /></label></div>
          <label>Room Category<select value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <div className="form-two"><label>Price / Night<input type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} /></label><label>Maximum Guests<input type="number" min="1" value={form.maxGuests} onChange={e=>setForm({...form,maxGuests:e.target.value})} /></label></div>
          <div className="form-two"><label>Bed Type<input value={form.bedType} onChange={e=>setForm({...form,bedType:e.target.value})} /></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{["Available","Occupied","Reserved","Cleaning","Maintenance","Out of Service"].map(s=><option key={s}>{s}</option>)}</select></label></div>
          <label>Image URL<input value={form.image} onChange={e=>setForm({...form,image:e.target.value})} /></label>
          <label>Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></label>
          <div className="modal-actions"><button type="button" className="room-btn room-btn-outline" onClick={()=>setShow(false)}>Cancel</button><button className="room-btn room-btn-primary">{editing?"Update Room":"Create Room"}</button></div>
        </form>
      </div></div>}
    </section>
  );
}
