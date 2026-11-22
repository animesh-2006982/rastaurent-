"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Plus,
  Settings,
  SlidersHorizontal,
  Tags,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import StaffLayout from "@/components/layout/StaffLayout";
import styles from "@/styles/operations.module.css";

type Tab = "dashboard" | "menu" | "ingredients" | "employees" | "reports" | "customization" | "settings";

const menuItems = [
  { id: 1, name: "Chicken Biryani", category: "Main Course", price: 220, available: true },
  { id: 2, name: "Paneer Butter Masala", category: "Main Course", price: 190, available: true },
  { id: 3, name: "Masala Tea", category: "Beverages", price: 70, available: true },
  { id: 4, name: "Cold Coffee", category: "Beverages", price: 120, available: false },
];

const employees = [
  { name: "Rahul Das", role: "Cashier", shift: "Morning", status: "Active" },
  { name: "Arjun Paul", role: "Waiter", shift: "Evening", status: "Active" },
  { name: "Sayan Roy", role: "Kitchen", shift: "Morning", status: "Active" },
  { name: "Rakesh Deb", role: "Manager", shift: "Full Day", status: "Active" },
];

export default function ManagerPage() {
  const params = useSearchParams();
  const requested = (params.get("tab") || "dashboard") as Tab;
  const tab: Tab = ["dashboard", "menu", "ingredients", "employees", "reports", "customization", "settings"].includes(requested)
    ? requested
    : "dashboard";

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [menu, setMenu] = useState(menuItems);

  const activeSidebar =
    tab === "menu" ? "Menu" :
    tab === "ingredients" ? "Inventory" :
    tab === "employees" ? "Employees" :
    tab === "reports" ? "Reports" :
    tab === "customization" ? "Customization" :
    tab === "settings" ? "Settings" : "Dashboard";

  const filteredMenu = useMemo(
    () => menu.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [menu, search]
  );

  const stats = [
    { label: "Today's Sales", value: "₹28,450", icon: IndianRupee, note: "+12.5%" },
    { label: "Orders Today", value: "126", icon: ClipboardList, note: "+8.2%" },
    { label: "Active Tables", value: "18 / 24", icon: UtensilsCrossed, note: "75% occupied" },
    { label: "Staff On Shift", value: "12", icon: Users, note: "2 managers" },
  ];

  return (
    <StaffLayout active={activeSidebar}>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>{tab === "dashboard" ? "Manager Dashboard" : tab[0].toUpperCase() + tab.slice(1)}</h1>
            <p>Clock Tower Restaurant & Cafe operations</p>
          </div>
          <div className={styles.headerActions}>
            {tab === "menu" && (
              <button className={styles.button} onClick={() => setShowAdd(true)}>
                <Plus size={17} /> Add Menu Item
              </button>
            )}
          </div>
        </div>

        {tab === "dashboard" && (
          <>
            <div className={styles.grid}>
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <div className={styles.statCard} key={item.label}>
                    <div className={styles.quickIcon}><Icon size={20} /></div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </div>
                );
              })}
            </div>

            <div className={styles.gridTwo}>
              <section className={styles.card}>
                <div className={styles.sectionTitle}><span>Sales Overview</span><BarChart3 size={19} /></div>
                <div className={styles.salesChart}>
                  {[45, 62, 52, 78, 66, 84, 72].map((height, i) => (
                    <div className={styles.chartColumn} key={i}>
                      <div className={styles.chartBar} style={{ height: `${height}%` }} />
                      <span>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.sectionTitle}><span>Quick Actions</span></div>
                <div className={styles.quickGrid}>
                  {[
                    ["Menu", Tags, "/pos/manager?tab=menu"],
                    ["Inventory", Boxes, "/pos/manager?tab=ingredients"],
                    ["Employees", Users, "/pos/manager?tab=employees"],
                    ["Reports", BarChart3, "/pos/manager?tab=reports"],
                  ].map(([label, Icon, href]) => (
                    <a className={styles.quickCard} href={href as string} key={label as string}>
                      {Icon && <Icon size={22} />}
                      <span>{label as string}</span>
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {tab === "menu" && (
          <section className={styles.section}>
            <div className={styles.toolbar}>
              <div className={styles.search}>
                <Tags size={17} />
                <input className={styles.searchInput} placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredMenu.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.category}</td>
                      <td>₹{item.price}</td>
                      <td><span className={`${styles.status} ${item.available ? styles.statusActive : styles.statusInactive}`}>{item.available ? "Available" : "Unavailable"}</span></td>
                      <td><button className={styles.secondaryButton} onClick={() => setMenu((m) => m.map((x) => x.id === item.id ? { ...x, available: !x.available } : x))}>Toggle</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "ingredients" && (
          <section className={styles.section}>
            <div className={styles.grid}>
              {[
                ["Rice", "42 kg", "Healthy"],
                ["Chicken", "18 kg", "Healthy"],
                ["Paneer", "7 kg", "Low Stock"],
                ["Cooking Oil", "12 L", "Healthy"],
              ].map(([name, qty, status]) => (
                <div className={styles.card} key={name}>
                  <div className={styles.sectionTitle}><span>{name}</span><Boxes size={18} /></div>
                  <strong>{qty}</strong>
                  <p>{status}</p>
                  <span className={`${styles.status} ${status === "Low Stock" ? styles.statusNew : styles.statusActive}`}>{status}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "employees" && (
          <section className={styles.section}>
            <div className={styles.staffList}>
              {employees.map((employee) => (
                <div className={styles.staffCard} key={employee.name}>
                  <div className={styles.staffAvatar}>{employee.name.split(" ").map((x) => x[0]).join("")}</div>
                  <div className={styles.staffInfo}>
                    <div className={styles.staffName}>{employee.name}</div>
                    <div>{employee.role} · {employee.shift}</div>
                  </div>
                  <span className={`${styles.status} ${styles.statusActive}`}>{employee.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "reports" && (
          <section className={styles.section}>
            <div className={styles.grid}>
              {[
                ["Gross Sales", "₹1,84,920"],
                ["Net Sales", "₹1,72,400"],
                ["Cash", "₹72,800"],
                ["UPI / Card", "₹99,600"],
              ].map(([label, value]) => (
                <div className={styles.card} key={label}><span>{label}</span><strong>{value}</strong></div>
              ))}
            </div>
            <div className={styles.card}>
              <div className={styles.sectionTitle}><span>Weekly Performance</span><BarChart3 size={19} /></div>
              <div className={styles.salesChart}>
                {[55, 72, 61, 86, 74, 91, 80].map((height, i) => <div className={styles.chartColumn} key={i}><div className={styles.chartBar} style={{ height: `${height}%` }} /><span>{["M","T","W","T","F","S","S"][i]}</span></div>)}
              </div>
            </div>
          </section>
        )}

        {tab === "customization" && (
          <section className={styles.section}>
            <div className={styles.gridTwo}>
              <div className={styles.card}><div className={styles.sectionTitle}><span>Restaurant Branding</span><SlidersHorizontal size={18} /></div><label className={styles.label}>Restaurant Name</label><input className={styles.input} defaultValue="Clock Tower Restaurant & Cafe" /><label className={styles.label}>Contact Number</label><input className={styles.input} defaultValue="+91 00000 00000" /></div>
              <div className={styles.card}><div className={styles.sectionTitle}><span>Receipt Settings</span><Settings size={18} /></div><label className={styles.label}>Footer Text</label><textarea className={styles.textarea} defaultValue="Thank you for dining with us!" /><button className={styles.button}>Save Changes</button></div>
            </div>
          </section>
        )}

        {tab === "settings" && (
          <section className={styles.section}>
            <div className={styles.card}>
              <div className={styles.sectionTitle}><span>System Settings</span><Settings size={18} /></div>
              {["Enable order notifications", "Require manager approval for discounts", "Auto-close completed orders"].map((x) => (
                <label key={x} style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: "1px solid #eee" }}>
                  <input type="checkbox" defaultChecked /> {x}
                </label>
              ))}
              <button className={styles.button}>Save Settings</button>
            </div>
          </section>
        )}

        {showAdd && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.sectionTitle}><span>Add Menu Item</span><button className={styles.secondaryButton} onClick={() => setShowAdd(false)}>Close</button></div>
              <label className={styles.label}>Item Name</label><input className={styles.input} placeholder="e.g. Veg Burger" />
              <label className={styles.label}>Category</label><select className={styles.select}><option>Main Course</option><option>Starters</option><option>Beverages</option><option>Desserts</option></select>
              <label className={styles.label}>Price</label><input className={styles.input} type="number" placeholder="0" />
              <button className={styles.button} onClick={() => setShowAdd(false)}><CheckCircle2 size={17} /> Save Item</button>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
