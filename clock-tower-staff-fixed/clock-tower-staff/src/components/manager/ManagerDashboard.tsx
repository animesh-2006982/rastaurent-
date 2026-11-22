"use client";
import { IndianRupee, ClipboardList, Table2, Users, ImagePlus, Plus, Trash2, Save, Upload, ChefHat, PackageSearch, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { menuItems, employees } from "@/data/mock";
import { useRestaurant } from "@/context/RestaurantContext";
import SalesChart from "./SalesChart";
import OrderStats from "./OrderStats";
import Button from "@/components/common/Button";

type Tab = "dashboard"|"menu"|"ingredients"|"employees"|"customization"|"reports"|"settings";

export default function ManagerDashboard({initialTab="dashboard"}:{initialTab?:Tab}){
  const [tab,setTab]=useState<Tab>(initialTab);
  useEffect(()=>{setTab(initialTab)},[initialTab]);

  if(tab==="dashboard") return <Dashboard onTab={setTab}/>;
  if(tab==="menu") return <MenuEditor onBack={()=>setTab("dashboard")}/>;
  if(tab==="ingredients") return <Ingredients onBack={()=>setTab("dashboard")}/>;
  if(tab==="employees") return <Staff onBack={()=>setTab("dashboard")}/>;
  if(tab==="customization") return <Customization onBack={()=>setTab("dashboard")}/>;
  return <SettingsPanel title={tab==="reports"?"Reports":"POS Settings"} onBack={()=>setTab("dashboard")}/>;
}

function Dashboard({onTab}:{onTab:(t:Tab)=>void}){
  return <div>
    <div className="page-head"><div><h1>Dashboard</h1><p>Welcome back! Here's what's happening today.</p></div><select className="field compact"><option>Today</option><option>This Week</option><option>This Month</option></select></div>
    <div className="stats-grid">
      <Stat title="Total Sales" value="₹24,850" sub="↑ 12% from yesterday" icon={<IndianRupee/>}/>
      <Stat title="Total Orders" value="128" sub="↑ 8% from yesterday" icon={<ClipboardList/>}/>
      <Stat title="Active Tables" value="12" sub="4 occupied" icon={<Table2/>}/>
      <Stat title="Staff Online" value="8" sub="2 in Kitchen" icon={<Users/>}/>
    </div>
    <div className="dashboard-grid">
      <section className="card chart-card"><div className="section-head"><h3>Sales Overview</h3><div className="mini-tabs"><button className="active">Sales</button><button>Orders</button><button>Payment Method</button></div></div><SalesChart/></section>
      <section className="card order-type"><div className="section-head"><h3>Order Type</h3><select className="field tiny"><option>Today</option></select></div><div className="donut"><div>128<small>Total Orders</small></div></div><OrderStats/></section>
    </div>
    <div className="quick-grid">
      <button onClick={()=>onTab("menu")} className="quick-card"><PackageSearch/><b>Menu & Recipes</b><span>Add food, ingredients, modifiers</span></button>
      <button onClick={()=>onTab("ingredients")} className="quick-card"><ChefHat/><b>Ingredients</b><span>Stock and recipe management</span></button>
      <button onClick={()=>onTab("employees")} className="quick-card"><Users/><b>Staff Management</b><span>Roles, PIN and permissions</span></button>
      <button onClick={()=>onTab("customization")} className="quick-card"><ImagePlus/><b>Website Customization</b><span>Photos, text, banners and offers</span></button>
    </div>
  </div>;
}
function Stat({title,value,sub,icon}:{title:string;value:string;sub:string;icon:React.ReactNode}){return <div className="stat-card"><div><small>{title}</small><strong>{value}</strong><em>{sub}</em></div><div className="stat-icon">{icon}</div></div>}

function MenuEditor({onBack}:{onBack:()=>void}){
  const [selected,setSelected]=useState(menuItems[0]); const [name,setName]=useState(selected.name); const [price,setPrice]=useState(String(selected.price)); const [desc,setDesc]=useState(selected.description); const [saved,setSaved]=useState(false);
  useEffect(()=>{setName(selected.name);setPrice(String(selected.price));setDesc(selected.description)},[selected]);
  function save(){setSaved(true);setTimeout(()=>setSaved(false),1600)}
  return <div><div className="page-head"><div><button className="back-link" onClick={onBack}>← Dashboard</button><h1>Edit Food Item</h1><p>Update food details and manage ingredients, add-ons and more.</p></div><div className="head-actions"><Button variant="soft">Preview on Website</Button><Button>Save Food Item</Button></div></div><div className="editor-layout"><div className="card editor-main"><div className="editor-photo"><img src={selected.image} alt=""/><button><Upload size={15}/>Upload Images</button></div><div className="field-grid"><label>Food Name *<input className="field" value={name} onChange={e=>setName(e.target.value)}/></label><label>Category<select className="field"><option>{selected.category}</option><option>Starters</option><option>Main Course</option><option>Pizza</option><option>Burger</option></select></label><label className="wide">Short Description<textarea className="field" value={desc} onChange={e=>setDesc(e.target.value)}/></label><label>Price (₹)<input className="field" value={price} onChange={e=>setPrice(e.target.value)}/></label><label>Discount Price (₹)<input className="field" defaultValue={selected.discountPrice||""}/></label><label>Preparation Time<input className="field" defaultValue={selected.prepTime}/></label><label>Availability<div className="switch-row"><span className="switch on"/><span>Available</span></div></label></div><div className="tabs-bar"><b>Ingredients (Recipe)</b><span>Add-ons / Modifiers</span><span>Pricing Options</span><span>Nutrition</span><span>Other Details</span></div><div className="ingredient-box"><div className="section-head"><h3>Sales Overview / Recipe</h3><button className="btn-link">+ Add Ingredient</button></div><table><thead><tr><th>Ingredient</th><th>Quantity</th><th>Unit</th><th>Action</th></tr></thead><tbody>{selected.ingredients.map(i=><tr key={i.id}><td>{i.name}</td><td>{i.name==="Basmati Rice"?250:i.name==="Chicken"?200:i.name==="Onion"?50:20}</td><td>{i.unit}</td><td><button className="danger-icon"><Trash2 size={14}/></button></td></tr>)}</tbody></table></div><div className="modifier-box"><div className="section-head"><h3>Add-ons / Modifiers</h3><button className="btn-link">+ Add Add-on</button></div>{selected.modifiers.map(m=><div className="modifier-row" key={m.id}><input type="checkbox"/><span>{m.name}</span><b>+ ₹{m.price}</b><button className="danger-icon"><Trash2 size={14}/></button></div>)}</div><button className="ct-btn ct-btn-primary full" onClick={save}><Save size={15}/>{saved?"Saved":"Save Food Item"}</button></div><aside className="card product-list"><h3>Products</h3>{menuItems.map(f=><button key={f.id} onClick={()=>setSelected(f)} className={selected.id===f.id?"selected":""}><img src={f.image}/><span><b>{f.name}</b><small>₹{f.price}</small></span><Pencil size={14}/></button>)}</aside></div></div>
}

function Ingredients({onBack}:{onBack:()=>void}){const rows=[["Rice",48,"kg",10],["Chicken",18,"kg",10],["Onion",30,"kg",10],["Oil",25,"L",5],["Spices",12,"kg",3]];return <div><div className="page-head"><div><button className="back-link" onClick={onBack}>← Dashboard</button><h1>Ingredients</h1><p>Manage all ingredients and stock details.</p></div><Button>+ Add Ingredient</Button></div><div className="stats-grid mini"><Stat title="Total Items" value="48" sub="Inventory items" icon={<PackageSearch/>}/><Stat title="Low Stock" value="6" sub="Need attention" icon={<ChefHat/>}/><Stat title="Out of Stock" value="2" sub="Immediate action" icon={<PackageSearch/>}/><Stat title="Total Value" value="₹24,850" sub="Current inventory" icon={<IndianRupee/>}/></div><div className="card table-card-wrap"><div className="table-toolbar"><input className="field" placeholder="Search ingredients..."/><Button>+ Add Ingredient</Button></div><table className="data-table"><thead><tr><th>Ingredient</th><th>Current Stock</th><th>Unit</th><th>Min Stock</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map(([name,stock,unit,min])=><tr key={name}><td><b>{name}</b></td><td>{stock}</td><td>{unit}</td><td>{min}</td><td><span className={`status-pill ${Number(stock)<=Number(min)?"low":"ok"}`}>{Number(stock)<=Number(min)?"Low Stock":"Available"}</span></td><td><button className="icon-btn"><Pencil size={14}/></button><button className="icon-btn danger"><Trash2 size={14}/></button></td></tr>)}</tbody></table></div></div>}

function Staff({onBack}:{onBack:()=>void}){return <div><div className="page-head"><div><button className="back-link" onClick={onBack}>← Dashboard</button><h1>Staff Management</h1><p>Add and manage restaurant staff.</p></div><Button>+ Add Staff</Button></div><div className="card table-card-wrap"><table className="data-table"><thead><tr><th>Staff</th><th>Role</th><th>Employee ID</th><th>Phone</th><th>Status</th><th>Action</th></tr></thead><tbody>{employees.map(e=><tr key={e.id}><td><div className="staff-cell"><div className="avatar">{e.name.split(" ").map(x=>x[0]).join("")}</div><b>{e.name}</b></div></td><td>{e.role}</td><td>{e.id}</td><td>{e.phone}</td><td><span className={`status-pill ${e.status==="Active"?"ok":"off"}`}>{e.status}</span></td><td><button className="icon-btn"><Pencil size={14}/></button><button className="icon-btn danger"><Trash2 size={14}/></button></td></tr>)}</tbody></table></div></div>}

function Customization({onBack}:{onBack:()=>void}){const {settings,update}=useRestaurant();const[title,setTitle]=useState(settings.heroTitle);const[sub,setSub]=useState(settings.heroSubtitle);const[img,setImg]=useState(settings.heroImage);const[saved,setSaved]=useState(false);function save(){update({heroTitle:title,heroSubtitle:sub,heroImage:img});setSaved(true);setTimeout(()=>setSaved(false),1400)}return <div><div className="page-head"><div><button className="back-link" onClick={onBack}>← Dashboard</button><h1>Website Customization</h1><p>Update your restaurant website content and appearance.</p></div><Button onClick={save}>{saved?"Saved ✓":"Save Changes"}</Button></div><div className="custom-layout"><div className="card customization-panel"><div className="custom-tabs"><button className="active">Hero Section</button><button>General</button><button>About</button><button>Gallery</button><button>Contact</button><button>SEO</button></div><label>Hero Image URL<input className="field" value={img} onChange={e=>setImg(e.target.value)}/></label><label>Hero Title<input className="field" value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Hero Subtitle<textarea className="field" value={sub} onChange={e=>setSub(e.target.value)}/></label><label>Button Text<input className="field" value={settings.buttonText} onChange={e=>update({buttonText:e.target.value})}/></label></div><div className="card website-preview"><div className="preview-image" style={{backgroundImage:`url(${img})`}}><div className="preview-overlay"><span>CLOCK TOWER</span><h2>{title}</h2><p>{sub}</p><button>{settings.buttonText}</button></div></div></div></div></div>}

function SettingsPanel({title,onBack}:{title:string;onBack:()=>void}){return <div><div className="page-head"><div><button className="back-link" onClick={onBack}>← Dashboard</button><h1>{title}</h1><p>Manage restaurant settings and permissions.</p></div></div><div className="settings-grid">{["Restaurant Profile","Theme & Colors","Banners & Offers","Menu Display","Receipt Settings","POS Settings","Roles & Permissions","Audit Logs"].map(x=><div className="card setting-card" key={x}><h3>{x}</h3><p>Configure {x.toLowerCase()} for Clock Tower.</p><Button variant="soft">Open Settings</Button></div>)}</div></div>}
