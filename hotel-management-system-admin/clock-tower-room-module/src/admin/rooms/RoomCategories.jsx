import React, { useEffect, useState } from "react";
import { addRoomCategory, deleteRoomCategory, getRoomCategories, updateRoomCategory } from "../../services/roomCategoryService";
import "./room.css";

const empty = { name: "", description: "", price: "", maxGuests: 2, bedType: "1 King Bed", roomSize: "", amenities: "", image: "", active: true };

export default function RoomCategories() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setItems(await getRoomCategories()); } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      const payload = { ...form, price: Number(form.price || 0), maxGuests: Number(form.maxGuests || 1), amenities: typeof form.amenities === "string" ? form.amenities.split(",").map(x => x.trim()).filter(Boolean) : form.amenities };
      if (editing) await updateRoomCategory(editing, payload);
      else await addRoomCategory(payload);
      setForm(empty); setEditing(null); setShow(false); await load();
    } catch (e) { console.error(e); alert("Could not save category."); }
    finally { setSaving(false); }
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({ ...empty, ...item, amenities: Array.isArray(item.amenities) ? item.amenities.join(", ") : item.amenities || "" });
    setShow(true);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this room category?")) return;
    try { await deleteRoomCategory(id); await load(); } catch (e) { console.error(e); alert("Could not delete category."); }
  };

  return (
    <section className="room-page">
      <div className="room-page-head">
        <div><span className="room-eyebrow">ROOMS & STAY</span><h1>Room Categories</h1><p>Create and manage room types shown on the public website.</p></div>
        <button className="room-btn room-btn-primary" onClick={() => { setEditing(null); setForm(empty); setShow(true); }}>+ Add Category</button>
      </div>

      <div className="room-card-grid">
        {items.map(item => (
          <article className="category-card" key={item.id}>
            <div className="category-image">{item.image ? <img src={item.image} alt={item.name} /> : <span>ROOM</span>}</div>
            <div className="category-body">
              <div className="category-title-row"><h3>{item.name}</h3><span className={`room-badge ${item.active === false ? "status-out-of-service" : "status-available"}`}>{item.active === false ? "Inactive" : "Active"}</span></div>
              <p>{item.description || "No description added."}</p>
              <div className="category-meta"><span>👤 {item.maxGuests || 2} guests</span><span>🛏 {item.bedType || "—"}</span><span>₹{Number(item.price || 0).toLocaleString("en-IN")}/night</span></div>
              <div className="category-actions"><button className="room-btn room-btn-small room-btn-outline" onClick={() => edit(item)}>Edit</button><button className="room-btn room-btn-small room-btn-danger" onClick={() => remove(item.id)}>Delete</button></div>
            </div>
          </article>
        ))}
      </div>

      {items.length === 0 && <div className="room-empty room-panel">No categories yet. Add Deluxe Room, Premium Suite, etc.</div>}

      {show && (
        <div className="room-modal-backdrop" onMouseDown={() => setShow(false)}>
          <div className="room-modal" onMouseDown={e => e.stopPropagation()}>
            <div className="room-modal-head"><div><h2>{editing ? "Edit Category" : "Add Room Category"}</h2><p>These details can be used by the public room listing.</p></div><button className="modal-close" onClick={() => setShow(false)}>×</button></div>
            <form onSubmit={submit} className="room-form">
              <label>Category Name<input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Deluxe Room" required /></label>
              <label>Description<textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Spacious room with..." /></label>
              <div className="form-two"><label>Price / Night<input type="number" min="0" value={form.price} onChange={e => setForm({...form,price:e.target.value})} /></label><label>Max Guests<input type="number" min="1" value={form.maxGuests} onChange={e => setForm({...form,maxGuests:e.target.value})} /></label></div>
              <div className="form-two"><label>Bed Type<input value={form.bedType} onChange={e => setForm({...form,bedType:e.target.value})} placeholder="1 King Bed" /></label><label>Room Size<input value={form.roomSize} onChange={e => setForm({...form,roomSize:e.target.value})} placeholder="350 sq ft" /></label></div>
              <label>Amenities <small>comma separated</small><input value={form.amenities} onChange={e => setForm({...form,amenities:e.target.value})} placeholder="Free WiFi, AC, TV, Breakfast" /></label>
              <label>Cover Image URL<input value={form.image} onChange={e => setForm({...form,image:e.target.value})} placeholder="https://..." /></label>
              <label className="check-label"><input type="checkbox" checked={form.active !== false} onChange={e => setForm({...form,active:e.target.checked})} /> Active category</label>
              <div className="modal-actions"><button type="button" className="room-btn room-btn-outline" onClick={() => setShow(false)}>Cancel</button><button disabled={saving} className="room-btn room-btn-primary">{saving ? "Saving..." : editing ? "Update Category" : "Create Category"}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
