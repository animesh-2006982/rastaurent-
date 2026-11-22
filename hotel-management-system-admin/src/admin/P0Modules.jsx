import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot,
  orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where
} from "firebase/firestore";
import { db } from "../firebase";
import { deductInventoryForSale } from "../inventoryService";
import {
  Plus, Minus, Trash2, Search, Printer, Download, RefreshCw, Check,
  X, ShieldCheck, GitBranch, Receipt, ChefHat, BarChart3, Save, RotateCcw
} from "lucide-react";

const INK = "#4C1504";
const BRASS = "#FF6B4A";
const LINE = "rgba(76,21,4,0.12)";
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const nowDate = () => new Date();
const dateKey = (d = nowDate()) => {
  const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
};
const clean = (v) => String(v ?? "").trim();
const num = (v) => Math.max(0, Number(v) || 0);

export const P0_ROLES = ["Super Admin","Owner","Head Office Admin","Branch Manager","Cashier","Waiter","Kitchen Staff","Delivery Partner","Inventory Manager","Accountant"];
export const P0_PERMISSIONS = ["orders","pos","billing","discounts","refunds","menu","pricing","inventory","purchasing","customers","reports","staff","rooms","settings"];
const ROLE_DEFAULTS = {
  "Super Admin": P0_PERMISSIONS,
  "Owner": P0_PERMISSIONS,
  "Head Office Admin": ["orders","pos","billing","discounts","refunds","menu","pricing","inventory","purchasing","customers","reports","staff","rooms","settings"],
  "Branch Manager": ["orders","pos","billing","discounts","refunds","menu","pricing","inventory","purchasing","customers","reports","staff","rooms"],
  "Cashier": ["orders","pos","billing","discounts","refunds","customers"],
  "Waiter": ["orders","pos","customers"],
  "Kitchen Staff": ["orders","inventory"],
  "Delivery Partner": ["orders","customers"],
  "Inventory Manager": ["inventory","purchasing","menu"],
  "Accountant": ["billing","refunds","reports","customers"]
};
const SECTION_PERMISSION = { rooms:"rooms", pos:"pos", kitchen:"orders", reports:"reports", audit:"settings", branches:"settings", staff:"staff", inventory:"inventory", purchasing:"purchasing", payments:"billing", pricing:"pricing", products:"menu", orders:"orders", tables:"orders", delivery:"orders", customers:"customers", offers:"menu", website:"menu", settings:"settings" };
export const normalizeRole = (role) => role === "Administrator" ? "Super Admin" : (P0_ROLES.includes(role) ? role : "Cashier");
export const hasP0Permission = (staff, permission) => {
  const role = normalizeRole(staff?.role);
  const explicit = Array.isArray(staff?.permissions) ? staff.permissions : null;
  const allowed = explicit || ROLE_DEFAULTS[role] || [];
  return role === "Super Admin" || allowed.includes(permission);
};
export const canAccessSection = (staff, section) => hasP0Permission(staff, SECTION_PERMISSION[section] || "settings");

async function audit({ staff, action, module, oldValue = null, newValue = null, branchId = "all", details = "" }) {
  try {
    await addDoc(collection(db, "auditLogs"), {
      userId: staff?.uid || staff?.id || "unknown",
      user: staff?.name || staff?.email || "Unknown user",
      action, module, oldValue, newValue,
      branchId: branchId || "all",
      details,
      date: dateKey(),
      time: nowDate().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit" }),
      device: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 220) : "unknown",
      createdAt: serverTimestamp()
    });
  } catch (e) { console.error("Audit log failed:", e); }
}

async function nextSequence(name, branchId = "all") {
  const ref = doc(db, "counters", `${name}_${branchId || "all"}`);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const next = Number(snap.exists() ? snap.data().value || 0 : 0) + 1;
    tx.set(ref, { value: next, updatedAt: serverTimestamp() }, { merge: true });
    return next;
  });
}

async function createNumber(type, branchId) {
  const n = await nextSequence(type, branchId);
  let prefix = type === "invoice" ? "INV" : type === "kot" ? "KOT" : "ORD";
  if (type === "invoice") {
    try { const snap = await getDoc(doc(db, "settings", "invoiceSettings")); if (snap.exists() && clean(snap.data().prefix)) prefix = clean(snap.data().prefix).toUpperCase(); } catch {}
  }
  return `${prefix}-${String(n).padStart(5,"0")}`;
}

function useCollection(collectionName, { branchId = "all", order = false, max = 200 } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let q = collection(db, collectionName);
    const constraints = [];
    if (branchId && branchId !== "all") constraints.push(where("branchId", "==", branchId));
    if (order) constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(max));
    try { q = query(q, ...constraints); } catch { q = query(collection(db, collectionName), limit(max)); }
    const unsub = onSnapshot(q, snap => { setRows(snap.docs.map(d => ({ id:d.id, ...d.data() }))); setLoading(false); }, err => { console.error(`${collectionName} listener`, err); setLoading(false); });
    return () => unsub();
  }, [collectionName, branchId, order, max]);
  return { rows, loading };
}

export function BranchSelector({ value, onChange, currentStaff }) {
  const { rows } = useCollection("branches", { max: 50 });
  const branches = rows.length ? rows : [
    { id:"branch-01", code:"Branch 01", name:"Branch 01", active:true },
    { id:"branch-02", code:"Branch 02", name:"Branch 02", active:true },
    { id:"branch-03", code:"Branch 03", name:"Branch 03", active:true }
  ];
  const canAll = normalizeRole(currentStaff?.role) === "Super Admin" || normalizeRole(currentStaff?.role) === "Owner" || normalizeRole(currentStaff?.role) === "Head Office Admin";
  return <div className="p0-branch-selector">
    <GitBranch size={15}/>
    <select value={value} onChange={e => onChange(e.target.value)} aria-label="Branch selector">
      {canAll && <option value="all">All Branches</option>}
      {branches.filter(b => b.active !== false && (canAll || !currentStaff?.branchId || b.id === currentStaff.branchId)).map(b => <option key={b.id} value={b.id}>{b.code || b.name || b.id}</option>)}
    </select>
  </div>;
}

function Field({ label, value, onChange, type="text", placeholder="", children }) {
  return <label className="p0-field"><span>{label}</span>{children || <input type={type} value={value ?? ""} placeholder={placeholder} onChange={e => onChange?.(e.target.value)} />}</label>;
}
function Btn({ children, onClick, disabled=false, secondary=false, danger=false, type="button" }) {
  return <button type={type} className={`p0-btn ${secondary ? "secondary" : ""} ${danger ? "danger" : ""}`} disabled={disabled} onClick={onClick}>{children}</button>;
}
function SectionCard({ title, icon:Icon, children, right }) { return <section className="p0-card"><div className="p0-card-head"><div>{Icon && <Icon size={17}/>}<strong>{title}</strong></div>{right}</div>{children}</section>; }
function Empty({ text="No records found." }) { return <div className="p0-empty">{text}</div>; }
function Loading() { return <div className="p0-loading">Loading…</div>; }

export function AdminPOS({ products = [], currentStaff, branchId = "all" }) {
  const [mode, setMode] = useState("Dine-in");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [couponRule, setCouponRule] = useState(null);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [customer, setCustomer] = useState({ name:"Walk-in Customer", phone:"", address:"", table:"" });
  const [paymentRows, setPaymentRows] = useState([{ method:"Cash", amount:"" }]);
  const [tax, setTax] = useState({ cgst:0, sgst:0, igst:0, inclusive:false, serviceCharge:0, roundOff:true });
  const [saving, setSaving] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [message, setMessage] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const { rows: taxRows } = useCollection("settings", { max:100 });

  useEffect(() => {
    const found = taxRows.find(x => x.id === "taxSettings");
    if (found) {
      setTax(t => ({ ...t, ...found }));
      setServiceCharge(current => num(current) ? current : num(found.serviceCharge));
    }
  }, [taxRows]);
  const cats = useMemo(() => ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);
  const filtered = products.filter(p => p.available !== false && (!search || String(p.name||"").toLowerCase().includes(search.toLowerCase())) && (category === "All" || p.category === category));
  const subtotal = cart.reduce((s,i)=>s + num(i.price)*num(i.qty),0);

  // Coupon discount is calculated from the CURRENT subtotal.
  // This fixes the case where FREE is applied before menu items are added.
  const couponDiscountValue = couponRule
    ? (
        couponRule.type === "percentage"
          ? subtotal * num(couponRule.value) / 100
          : num(couponRule.value)
      )
    : 0;

  const discountValue = Math.min(
    subtotal,
    Math.max(0, num(discount) + couponDiscountValue)
  );

  const taxable = Math.max(0, subtotal - discountValue);
  const inclusiveRate = tax.interState ? num(tax.igst) : num(tax.cgst)+num(tax.sgst);
  const baseTax = tax.inclusive && inclusiveRate ? taxable - taxable/(1+inclusiveRate/100) : taxable*inclusiveRate/100;
  const service = taxable * num(serviceCharge || tax.serviceCharge)/100;
  const rawTotal = tax.inclusive ? taxable + service : taxable + baseTax + service;
  const total = tax.roundOff ? Math.round(rawTotal) : Math.round(rawTotal*100)/100;
  const paid = paymentRows.reduce((s,p)=>s+num(p.amount),0);
  const due = Math.max(0,total-paid);

  const add = (p) => setCart(c => { const x=c.find(i=>i.productId===p.id); return x ? c.map(i=>i.productId===p.id?{...i,qty:i.qty+1}:i) : [...c,{productId:p.id,name:p.name,price:num(p.price),qty:1,modifiers:[]}]; });
  const changeQty = (id,d) => setCart(c=>c.map(i=>i.productId===id?{...i,qty:Math.max(1,i.qty+d)}:i));
  const remove = id => setCart(c=>c.filter(i=>i.productId!==id));
  const addPayment = () => setPaymentRows(p=>[...p,{method:"UPI",amount:""}]);
  const updatePayment = (i,k,v) => setPaymentRows(p=>p.map((x,idx)=>idx===i?{...x,[k]:v}:x));
  const applyCoupon = async () => {
    const code = clean(coupon).toUpperCase();
    if (!code) return setCouponMessage("Enter a coupon code.");

    try {
      const snap = await getDocs(
        query(collection(db, "coupons"), where("code", "==", code), limit(5))
      );

      if (snap.empty) {
        setCouponRule(null);
        return setCouponMessage("Coupon not found.");
      }

      const c = snap.docs
        .map(d => ({ id:d.id, ...d.data() }))
        .find(x => x.active !== false);

      if (!c) {
        setCouponRule(null);
        return setCouponMessage("Coupon is inactive.");
      }

      const rawType = clean(c.type || c.discountType).toLowerCase();
      const type = rawType === "percentage" ? "percentage" : "fixed";
      const value = num(c.value ?? c.discount);

      if (value <= 0) {
        setCouponRule(null);
        return setCouponMessage("Coupon has no valid discount value.");
      }

      // Store the coupon rule, not the current subtotal calculation.
      // This keeps the discount correct when cart items are added/removed later.
      setCouponRule({ type, value, code });

      setCouponMessage(
        type === "percentage"
          ? `Coupon applied: ${code} (${value}% off)`
          : `Coupon applied: ${code} (${money(value)} off)`
      );
    } catch (e) {
      setCouponRule(null);
      setCouponMessage(e?.message || "Unable to validate coupon.");
    }
  };

  const reset = () => {
    setCart([]);
    setDiscount(0);
    setCoupon("");
    setCouponRule(null);
    setCouponMessage("");
    setServiceCharge(0);
    setPaymentRows([{method:"Cash",amount:""}]);
    setLastInvoice(null);
  };

  const checkout = async () => {
    if (!cart.length) return setMessage("Add at least one product.");
    if (mode === "Dine-in" && !clean(customer.table)) return setMessage("Enter a table number for dine-in billing.");
    if (paid > total + 0.01) return setMessage("Payment cannot exceed the bill total.");
    setSaving(true); setMessage("");
    try {
      const orderNo = await createNumber("order", branchId);
      const invoiceNo = await createNumber("invoice", branchId);
      const orderRef = doc(collection(db,"orders"));
      const invoiceRef = doc(db,"invoices",invoiceNo);
      const paymentStatus = paid >= total - 0.01 ? "Paid" : paid > 0 ? "Partially Paid" : "Pending";
      const order = { id:orderNo, orderNumber:orderNo, invoiceNumber:invoiceNo, branchId, type:mode, customer, items:cart, subtotal, discount:discountValue, coupon, tax:{cgst:tax.interState?0:num(tax.cgst),sgst:tax.interState?0:num(tax.sgst),igst:tax.interState?num(tax.igst):0,amount:baseTax,inclusive:!!tax.inclusive,interState:!!tax.interState}, serviceCharge:service, roundOff:tax.roundOff ? total-rawTotal : 0, total, paid, due, paymentStatus, status:"New", createdBy:currentStaff?.uid||currentStaff?.id||"unknown", createdAt:serverTimestamp(), updatedAt:serverTimestamp() };
      await setDoc(orderRef, order);

      // SALE → RECIPE → INGREDIENT USAGE → INVENTORY DEDUCTION
      // Uses a transaction + idempotency key so the same sale is not deducted twice.
      await deductInventoryForSale({
        orderId: orderRef.id,
        orderNumber: orderNo,
        branchId,
        items: cart,
        createdBy: currentStaff?.uid || currentStaff?.id || "unknown"
      });
      const invoice = { id:invoiceNo, invoiceNumber:invoiceNo, prefix:"INV", orderId:orderRef.id, orderNumber:orderNo, branchId, customer, gstInvoice:!!(tax.cgst||tax.sgst||tax.igst), items:cart, subtotal, discount:discountValue, tax:order.tax, serviceCharge:service, roundOff:order.roundOff, total, status:"Active", createdBy:currentStaff?.uid||currentStaff?.id||"unknown", createdAt:serverTimestamp() };
      await setDoc(invoiceRef, invoice);
      for (const p of paymentRows.filter(x=>num(x.amount)>0)) {
        const txId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
        await setDoc(doc(db,"payments",txId), { id:txId, orderId:orderRef.id, orderNumber:orderNo, invoiceNumber:invoiceNo, branchId, method:p.method, amount:num(p.amount), status:paymentStatus === "Paid" ? "Paid" : "Pending", transactionId: p.transactionId || "", upiReference:p.upiReference||"", createdBy:currentStaff?.uid||currentStaff?.id||"unknown", createdAt:serverTimestamp() });
      }
      if (cart.length) {
        const kotNo = await createNumber("kot", branchId);
        await setDoc(doc(db,"kots",kotNo), { id:kotNo,kotNumber:kotNo,orderId:orderRef.id,orderNumber:orderNo,branchId,tableNumber:customer.table||"",items:cart.map(i=>({...i,status:"New"})),specialInstructions:"",status:"New",station:"Main Kitchen",createdAt:serverTimestamp(),updatedAt:serverTimestamp() });
      }
      await audit({staff:currentStaff,action:"CREATE",module:"POS",newValue:{orderNumber:orderNo,total},branchId,details:`${mode} bill created`});
      setLastInvoice({ ...invoice, invoiceNumber:invoiceNo, orderNumber:orderNo });
      setMessage(`Order ${orderNo} created successfully.`);
      setCart([]); setPaymentRows([{method:"Cash",amount:""}]);
    } catch(e) { console.error(e); setMessage(e?.message || "Unable to save the bill. Check Firestore Rules and try again."); }
    finally { setSaving(false); }
  };
  const cancelLatest = async () => {
    if (!lastInvoice) return;
    if (!window.confirm(`Cancel invoice ${lastInvoice.invoiceNumber}?`)) return;
    try {
      await updateDoc(doc(db, "invoices", lastInvoice.invoiceNumber), { status:"Cancelled", updatedAt:serverTimestamp() });
      const ordersSnap = await getDocs(query(collection(db,"orders"), where("orderNumber","==",lastInvoice.orderNumber), limit(5)));
      await Promise.all(ordersSnap.docs.map(d => updateDoc(d.ref,{status:"Cancelled",updatedAt:serverTimestamp()})));
      await audit({staff:currentStaff,action:"ORDER_CANCEL",module:"POS",oldValue:"Active",newValue:"Cancelled",branchId,details:lastInvoice.invoiceNumber});
      setMessage(`Invoice ${lastInvoice.invoiceNumber} cancelled.`);
    } catch(e) { alert(e?.message||"Unable to cancel bill"); }
  };
  const print = () => lastInvoice && printDocument("Invoice", invoiceHtml(lastInvoice));

  return (
    <div className="p0-page ctpos-page">
      {message && (
        <div className="p0-message ctpos-message">
          {message}
        </div>
      )}

      {/* =====================================================
          POS HEADER
          ===================================================== */}
      <div className="ctpos-header">
        <div className="ctpos-heading">
          <span>STAFF WORKSPACE</span>
          <h1>POS / Billing</h1>
          <p>
            Everything you need to keep the restaurant running smoothly.
          </p>
        </div>

        <div className="ctpos-header-right">
          <div className="ctpos-date">
            <span className="ctpos-date-icon">
              <Receipt size={17} />
            </span>
            <div>
              <strong>
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
              <small>Today</small>
            </div>
          </div>

          <div className="ctpos-time">
            <span>
              {new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN POS WORKSPACE
          ===================================================== */}
      <div className="ctpos-workspace">

        {/* ===================================================
            LEFT / MAIN COLUMN
            =================================================== */}
        <div className="ctpos-main-column">

          {/* ORDER TYPE */}
          <section className="ctpos-card ctpos-order-card">
            <div className="ctpos-card-title">
              <div>
                <Receipt size={19} />
                <strong>Order Type</strong>
              </div>
            </div>

            <div className="ctpos-order-types">
              {[
                "Dine-in",
                "Takeaway",
                "Delivery",
                "Pre-order",
                "QR Order",
              ].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={
                    mode === type
                      ? "ctpos-order-type active"
                      : "ctpos-order-type"
                  }
                  onClick={() => setMode(type)}
                >
                  <span className="ctpos-order-icon">
                    {type === "Dine-in" && "🍴"}
                    {type === "Takeaway" && "🛍"}
                    {type === "Delivery" && "🚚"}
                    {type === "Pre-order" && "◷"}
                    {type === "QR Order" && "▦"}
                  </span>
                  <span>{type}</span>
                </button>
              ))}
            </div>

            <div className="ctpos-order-divider" />

            <div className="ctpos-customer-grid">
              <Field
                label="Customer Name"
                value={customer.name}
                placeholder="Enter customer name"
                onChange={(value) =>
                  setCustomer({
                    ...customer,
                    name: value,
                  })
                }
              />

              <Field
                label="Phone Number"
                value={customer.phone}
                placeholder="Enter phone number"
                onChange={(value) =>
                  setCustomer({
                    ...customer,
                    phone: value,
                  })
                }
              />

              <Field
                label={
                  mode === "Dine-in"
                    ? "Table Number"
                    : "Address"
                }
                value={
                  mode === "Dine-in"
                    ? customer.table
                    : customer.address
                }
                placeholder={
                  mode === "Dine-in"
                    ? "Table No"
                    : "Customer address"
                }
                onChange={(value) =>
                  setCustomer({
                    ...customer,
                    [mode === "Dine-in"
                      ? "table"
                      : "address"]: value,
                  })
                }
              />

              <div className="ctpos-coupon-field">
                <Field
                  label="Coupon Code"
                  value={coupon}
                  placeholder="Enter code"
                  onChange={(value) => {
                    setCoupon(value);
                    setCouponMessage("");
                  }}
                />

                <button
                  type="button"
                  className="ctpos-apply-btn"
                  onClick={applyCoupon}
                >
                  Apply
                </button>

                {couponMessage && (
                  <small className="ctpos-coupon-message">
                    {couponMessage}
                  </small>
                )}
              </div>
            </div>
          </section>

          {/* MENU */}
          <section className="ctpos-card ctpos-menu-card">
            <div className="ctpos-menu-header">
              <div className="ctpos-menu-title">
                <Search size={21} />
                <strong>Menu</strong>
              </div>

              <div className="ctpos-menu-tools">
                <div className="ctpos-menu-search">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products (e.g. momo, chicken...)"
                  />
                </div>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="ctpos-category-select"
                >
                  {cats.map((item) => (
                    <option key={item} value={item}>
                      {item === "All" ? "All Categories" : item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ctpos-category-tabs">
              {cats.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    category === item ? "active" : ""
                  }
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="ctpos-product-grid">
              {filtered.map((product) => (
                <article
                  className="ctpos-product-card"
                  key={product.id}
                >
                  <div className="ctpos-product-image">
                    {product.image || product.imageUrl ? (
                      <img
                        src={product.image || product.imageUrl}
                        alt={product.name || "Menu item"}
                      />
                    ) : (
                      <div className="ctpos-product-placeholder">
                        🍽
                      </div>
                    )}
                  </div>

                  <div className="ctpos-product-body">
                    <h4>{product.name}</h4>

                    <strong>
                      {money(product.price)}
                    </strong>

                    <button
                      type="button"
                      onClick={() => add(product)}
                      className="ctpos-add-product"
                    >
                      <Plus size={15} />
                      Add
                    </button>
                  </div>
                </article>
              ))}

              {!filtered.length && (
                <div className="ctpos-no-products">
                  <Search size={30} />
                  <strong>No products found</strong>
                  <span>
                    Try another search or category.
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ===================================================
            RIGHT — CURRENT BILL
            =================================================== */}
        <aside className="ctpos-current-bill">
          <section className="ctpos-card ctpos-bill-card">

            <div className="ctpos-bill-header">
              <div>
                <Receipt size={20} />
                <strong>
                  Current Bill ({cart.length})
                </strong>
              </div>

              <button
                type="button"
                className="ctpos-clear-all"
                onClick={reset}
                disabled={!cart.length}
              >
                <Trash2 size={14} />
                Clear All
              </button>
            </div>

            {/* CART */}
            {!cart.length ? (
              <div className="ctpos-empty-cart">
                <Receipt size={34} />
                <strong>Cart is empty.</strong>
                <span>
                  Add menu items to create a bill.
                </span>
              </div>
            ) : (
              <div className="ctpos-cart-items">
                {cart.map((item) => (
                  <div
                    className="ctpos-cart-item"
                    key={item.productId}
                  >
                    <div className="ctpos-cart-info">
                      <strong>{item.name}</strong>
                      <small>
                        {money(item.price)} each
                      </small>
                    </div>

                    <div className="ctpos-cart-qty">
                      <button
                        type="button"
                        onClick={() =>
                          changeQty(item.productId, -1)
                        }
                      >
                        <Minus size={13} />
                      </button>

                      <b>{item.qty}</b>

                      <button
                        type="button"
                        onClick={() =>
                          changeQty(item.productId, 1)
                        }
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <strong>
                      {money(item.price * item.qty)}
                    </strong>

                    <button
                      type="button"
                      className="ctpos-remove-item"
                      onClick={() =>
                        remove(item.productId)
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* SUMMARY */}
            <div className="ctpos-bill-summary">
              <div>
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <div className="ctpos-summary-input">
                <span>Discount</span>

                <div>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => {
                      setCouponRule(null);
                      setDiscount(e.target.value);
                      setCouponMessage(
                        e.target.value
                          ? "Manual discount applied."
                          : ""
                      );
                    }}
                  />
                  <button type="button">%</button>
                </div>

                <strong>
                  {money(discountValue)}
                </strong>
              </div>

              <div className="ctpos-summary-input">
                <span>Service charge (%)</span>

                <div>
                  <input
                    type="number"
                    min="0"
                    value={serviceCharge}
                    onChange={(e) =>
                      setServiceCharge(e.target.value)
                    }
                  />
                  <button type="button">%</button>
                </div>

                <strong>
                  {money(service)}
                </strong>
              </div>

              {!tax.inclusive && (
                <div>
                  <span>GST</span>
                  <strong>{money(baseTax)}</strong>
                </div>
              )}

              <div className="ctpos-total-row">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>

              <div>
                <span>Paid</span>
                <strong>{money(paid)}</strong>
              </div>

              <div>
                <span>Due</span>
                <strong>{money(due)}</strong>
              </div>
            </div>

            {/* PAYMENTS */}
            <div className="ctpos-payments">
              <div className="ctpos-payments-title">
                <Receipt size={18} />
                <strong>Payments</strong>
              </div>

              {paymentRows.map((payment, index) => (
                <div
                  className="ctpos-payment-row"
                  key={index}
                >
                  <select
                    value={payment.method}
                    onChange={(e) =>
                      updatePayment(
                        index,
                        "method",
                        e.target.value
                      )
                    }
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                  </select>

                  <input
                    type="number"
                    min="0"
                    value={payment.amount}
                    placeholder="Amount"
                    onChange={(e) =>
                      updatePayment(
                        index,
                        "amount",
                        e.target.value
                      )
                    }
                  />

                  <input
                    value={payment.transactionId || ""}
                    placeholder="Txn ID / UPI ref"
                    onChange={(e) =>
                      updatePayment(
                        index,
                        "transactionId",
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="ctpos-payment-remove"
                    disabled={paymentRows.length === 1}
                    onClick={() =>
                      setPaymentRows((rows) =>
                        rows.filter(
                          (_, i) => i !== index
                        )
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="ctpos-split-payment"
                onClick={addPayment}
              >
                <Plus size={16} />
                Split / Add payment
              </button>
            </div>

            {/* ACTIONS */}
            <div className="ctpos-bill-actions">
              <button
                type="button"
                className="ctpos-create-bill"
                onClick={checkout}
                disabled={saving}
              >
                <Receipt size={17} />
                {saving
                  ? "Saving..."
                  : "Create Bill & KOT"}
              </button>

              <button
                type="button"
                className="ctpos-clear-bill"
                onClick={reset}
              >
                <RotateCcw size={16} />
                Clear
              </button>

              {lastInvoice && (
                <>
                  <button
                    type="button"
                    className="ctpos-secondary-action"
                    onClick={print}
                  >
                    <Printer size={15} />
                    Reprint
                  </button>

                  <button
                    type="button"
                    className="ctpos-danger-action"
                    onClick={cancelLatest}
                  >
                    <X size={15} />
                    Cancel / Void
                  </button>
                </>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function invoiceHtml(inv) {
  return `<div style="font-family:Arial;padding:24px;max-width:760px;margin:auto"><h1>${escapeHtml(inv.invoiceNumber||"Invoice")}</h1><p>Order: ${escapeHtml(inv.orderNumber||"")}</p><hr/><table style="width:100%;border-collapse:collapse"><tr><th align="left">Item</th><th>Qty</th><th align="right">Amount</th></tr>${(inv.items||[]).map(i=>`<tr><td>${escapeHtml(i.name)}</td><td align="center">${i.qty}</td><td align="right">${money(i.price*i.qty)}</td></tr>`).join("")}</table><hr/><p>Subtotal: ${money(inv.subtotal)}</p><p>Discount: ${money(inv.discount)}</p><p>Tax: ${money(inv.tax?.amount)}</p><p>Service charge: ${money(inv.serviceCharge)}</p><h2>Total: ${money(inv.total)}</h2></div>`;
}
function escapeHtml(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));}
function printDocument(title, html) { const w=window.open("","_blank","width=900,height=700"); if(!w)return; w.document.write(`<html><head><title>${escapeHtml(title)}</title></head><body>${html}<script>window.onload=()=>window.print()<\/script></body></html>`); w.document.close(); }
function downloadText(filename, content, mime="text/plain") { const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type:mime})); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
function exportCSV(filename, rows) { const keys=Array.from(new Set(rows.flatMap(r=>Object.keys(r)))); const csv=[keys.join(","),...rows.map(r=>keys.map(k=>`"${String(r[k]??"").replace(/"/g,'""')}"`).join(","))].join("\n"); downloadText(filename,csv,"text/csv;charset=utf-8"); }
function exportExcel(filename, rows) { const keys=Array.from(new Set(rows.flatMap(r=>Object.keys(r)))); const html=`<table><tr>${keys.map(k=>`<th>${escapeHtml(k)}</th>`).join("")}</tr>${rows.map(r=>`<tr>${keys.map(k=>`<td>${escapeHtml(r[k])}</td>`).join("")}</tr>`).join("")}</table>`; downloadText(filename,`<html><body>${html}</body></html>`,'application/vnd.ms-excel'); }

async function deductRecipeIngredients(kot) {
  if (kot.inventoryDeducted) return;
  const recipeIds = (kot.items || []).map(i => i.productId).filter(Boolean);
  if (!recipeIds.length) return;
  const recipeSnaps = await Promise.all(recipeIds.map(id => getDoc(doc(db, "recipes", id))));
  const recipeMap = {};
  recipeSnaps.forEach(s => { if (s.exists()) recipeMap[s.id] = s.data(); });
  const deductions = {};
  (kot.items || []).forEach(item => {
    const recipe = recipeMap[item.productId];
    if (!recipe) return;
    (recipe.ingredients || []).forEach(ing => {
      if (!ing.inventoryId) return;
      deductions[ing.inventoryId] = (deductions[ing.inventoryId] || 0) + num(ing.qty) * num(item.qty);
    });
  });
  const entries = Object.entries(deductions);
  if (!entries.length) return;
  await runTransaction(db, async tx => {
    const snaps = await Promise.all(entries.map(([id]) => tx.get(doc(db, "inventory", id))));
    snaps.forEach((snap, idx) => {
      if (!snap.exists()) return;
      const current = num(snap.data().qty ?? snap.data().stock);
      const next = Math.max(0, current - entries[idx][1]);
      tx.update(snap.ref, { qty: next, updatedAt: serverTimestamp(), updated: "Recipe deduction" });
    });
    tx.update(doc(db, "kots", kot.id), { inventoryDeducted: true, inventoryDeductedAt: serverTimestamp() });
  });
}

export function AdminKitchen({ currentStaff, branchId="all" }) {
  const [tab, setTab] = useState("kots");
  const [stations] = useState(["Main Kitchen", "Grill", "Beverage", "Dessert", "Packing"]);
  const [station, setStation] = useState("All");
  const { rows: kots, loading } = useCollection("kots", { branchId, order: true });

  const update = async (kot, status) => {
    try {
      if (status === "Completed") await deductRecipeIngredients(kot);
      const statusTimes = status === "Accepted" ? { acceptedAt: serverTimestamp() } : status === "Preparing" ? { preparingAt: serverTimestamp() } : {};
      await updateDoc(doc(db, "kots", kot.id), {
        status,
        ...statusTimes,
        updatedAt: serverTimestamp(),
        lastActionBy: currentStaff?.uid || currentStaff?.id || "unknown"
      });
      await audit({
        staff: currentStaff,
        action: `KOT_${status.toUpperCase()}`,
        module: "Kitchen",
        oldValue: kot.status,
        newValue: status,
        branchId
      });
    } catch (e) {
      console.error(e);
      alert(e?.message || "Unable to update KOT");
    }
  };

  const removeItem = async (kot, index) => {
    const item = (kot.items || [])[index];
    if (!item) return;
    try {
      const next = (kot.items || []).filter((_, i) => i !== index);
      await updateDoc(doc(db, "kots", kot.id), {
        items: next,
        updatedAt: serverTimestamp()
      });
      await audit({ staff: currentStaff, action: "KOT_ITEM_CANCEL", module: "Kitchen", oldValue: item, newValue: null, branchId });
    } catch (e) {
      alert(e?.message || "Unable to cancel item");
    }
  };

  const modifyItem = async (kot, index) => {
    const item = (kot.items || [])[index];
    if (!item) return;
    const qtyText = window.prompt(`Quantity for ${item.name}`, String(item.qty || 1));
    if (qtyText === null) return;
    const qty = Math.max(1, Number(qtyText) || 1);
    try {
      const next = (kot.items || []).map((x, i) => i === index ? { ...x, qty } : x);
      await updateDoc(doc(db, "kots", kot.id), { items: next, updatedAt: serverTimestamp() });
      await audit({ staff: currentStaff, action: "KOT_ITEM_MODIFY", module: "Kitchen", oldValue: item, newValue: next[index], branchId });
    } catch (e) { alert(e?.message || "Unable to modify item"); }
  };

  const modifyInstructions = async (kot) => {
    const text = window.prompt("Special instructions", kot.specialInstructions || "");
    if (text === null) return;
    try {
      await updateDoc(doc(db, "kots", kot.id), { specialInstructions: text, updatedAt: serverTimestamp() });
      await audit({ staff: currentStaff, action: "KOT_MODIFY", module: "Kitchen", oldValue: kot.specialInstructions || "", newValue: text, branchId });
    } catch (e) {
      alert(e?.message || "Unable to modify KOT");
    }
  };

  const printKot = (kot) => printDocument(
    kot.kotNumber,
    `<div style="font-family:Arial;padding:20px"><h2>${escapeHtml(kot.kotNumber)}</h2><p>Order: ${escapeHtml(kot.orderNumber)} | Table: ${escapeHtml(kot.tableNumber || "—")}</p><hr/>${(kot.items || []).map(i => `<p><b>${i.qty} × ${escapeHtml(i.name)}</b></p>`).join("")}<p>Instructions: ${escapeHtml(kot.specialInstructions || "—")}</p></div>`
  );

  const visibleKots = station === "All" ? kots : kots.filter(k => (k.station || "Main Kitchen") === station);

  return (
    <div className="p0-page">
      <div className="p0-tabs">
        <button className={tab === "kots" ? "active" : ""} onClick={() => setTab("kots")}>KOT Management</button>
        <button className={tab === "kds" ? "active" : ""} onClick={() => setTab("kds")}>Kitchen Display</button>
      </div>

      {tab === "kots" ? (
        <SectionCard
          title="Kitchen Orders (KOT)"
          icon={ChefHat}
          right={<select className="p0-select-small" value={station} onChange={e => setStation(e.target.value)}><option>All</option>{stations.map(s => <option key={s}>{s}</option>)}</select>}
        >
          {loading ? <Loading /> : !visibleKots.length ? <Empty text="No KOTs yet. Create one from POS." /> : (
            <div className="p0-kot-grid">
              {visibleKots.map(k => (
                <article className="p0-kot" key={k.id}>
                  <div className="p0-kot-head"><strong>{k.kotNumber}</strong><span>{k.status}</span></div>
                  <p>Order {k.orderNumber} · Table {k.tableNumber || "—"} · {k.station || "Main Kitchen"}</p>
                  {(k.items || []).map((item, idx) => (
                    <div className="p0-kot-item" key={`${k.id}-${idx}`}>
                      <b>{item.qty} × {item.name}</b><span>{item.status || "New"}</span>
                    </div>
                  ))}
                  <small>Instructions: {k.specialInstructions || "—"}</small>
                  <div className="p0-actions">
                    {(k.items || []).map((item, idx) => (
                      <React.Fragment key={`${k.id}-item-actions-${idx}`}>
                        <Btn secondary onClick={() => modifyItem(k, idx)}>Modify item: {item.name}</Btn>
                        <Btn secondary onClick={() => removeItem(k, idx)}>Cancel item: {item.name}</Btn>
                      </React.Fragment>
                    ))}
                    <Btn secondary onClick={() => modifyInstructions(k)}>Modify instructions</Btn>
                    <Btn secondary onClick={() => printKot(k)}><Printer size={13} /> Print / Reprint</Btn>
                    <select className="p0-select-small" value={k.status || "New"} onChange={e => update(k, e.target.value)}>
                      <option>New</option><option>Accepted</option><option>Preparing</option><option>Ready</option><option>Completed</option><option>Cancelled</option>
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      ) : <KDS kots={visibleKots} update={update} />}
    </div>
  );
}

function KDS({ kots, update }) {
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(id); }, []);
  const active = kots.filter(k => ["New", "Accepted", "Preparing", "Ready"].includes(k.status));
  const elapsed = (kot) => { const start = kot.preparingAt?.toDate?.() || kot.acceptedAt?.toDate?.() || kot.createdAt?.toDate?.(); if (!start) return "00:00"; const sec = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000)); return `${String(Math.floor(sec / 60)).padStart(2,"0")}:${String(sec % 60).padStart(2,"0")}`; };
  return (
    <div className="p0-kds-grid">
      {active.map(k => (
        <article className={`p0-kds-card status-${String(k.status).toLowerCase()}`} key={k.id}>
          <div className="p0-kot-head"><strong>{k.kotNumber}</strong><span>{k.status}</span></div>
          <h3>Order {k.orderNumber}</h3>
          <small>Table {k.tableNumber || "—"} · {k.station || "Main Kitchen"}</small>
          <div className="p0-timer">⏱ Preparation timer: {elapsed(k)}</div>
          {(k.items || []).map((item, idx) => <div className="p0-kot-item" key={idx}><b>{item.qty} × {item.name}</b><span>{item.instructions || ""}</span></div>)}
          <div className="p0-actions">
            {k.status === "New" && <Btn onClick={() => update(k, "Accepted")}><Check size={13} /> Accept</Btn>}
            {k.status === "Accepted" && <Btn onClick={() => update(k, "Preparing")}>Start Preparing</Btn>}
            {k.status === "Preparing" && <Btn onClick={() => update(k, "Ready")}>Mark Ready</Btn>}
            {k.status === "Ready" && <Btn onClick={() => update(k, "Completed")}>Complete</Btn>}
          </div>
        </article>
      ))}
      {!active.length && <Empty text="No active kitchen tickets." />}
    </div>
  );
}

export function AdminTaxSettings({ currentStaff, branchId="all" }) {
  const [form,setForm]=useState({gstin:"",cgst:2.5,sgst:2.5,igst:5,interState:false,inclusive:false,serviceCharge:0,roundOff:true,defaultProductTax:5}); const [saving,setSaving]=useState(false);
  useEffect(()=>{getDoc(doc(db,"settings","taxSettings")).then(s=>s.exists()&&setForm(f=>({...f,...s.data()}))).catch(console.error)},[]);
  const save=async()=>{setSaving(true);try{await setDoc(doc(db,"settings","taxSettings"),{...form,branchId,updatedAt:serverTimestamp()},{merge:true});await audit({staff:currentStaff,action:"UPDATE",module:"Tax & GST",newValue:form,branchId});alert("Tax settings saved.")}catch(e){alert(e?.message||"Unable to save tax settings")}finally{setSaving(false)}};
  return <SectionCard title="Tax & GST" icon={Receipt}><div className="p0-grid-4"><Field label="GSTIN" value={form.gstin} onChange={v=>setForm({...form,gstin:v})}/><Field label="CGST %" type="number" value={form.cgst} onChange={v=>setForm({...form,cgst:v})}/><Field label="SGST %" type="number" value={form.sgst} onChange={v=>setForm({...form,sgst:v})}/><Field label="IGST %" type="number" value={form.igst} onChange={v=>setForm({...form,igst:v})}/><Field label="Service charge %" type="number" value={form.serviceCharge} onChange={v=>setForm({...form,serviceCharge:v})}/><Field label="Default product tax %" type="number" value={form.defaultProductTax} onChange={v=>setForm({...form,defaultProductTax:v})}/><label className="p0-check"><input type="checkbox" checked={!!form.inclusive} onChange={e=>setForm({...form,inclusive:e.target.checked})}/> Tax-inclusive pricing</label><label className="p0-check"><input type="checkbox" checked={!!form.interState} onChange={e=>setForm({...form,interState:e.target.checked})}/> Inter-state billing (IGST only)</label><label className="p0-check"><input type="checkbox" checked={!!form.roundOff} onChange={e=>setForm({...form,roundOff:e.target.checked})}/> Round-off bill total</label></div><div className="p0-note">CGST + SGST are used for intra-state billing; IGST is available for inter-state billing. POS uses the saved configuration rather than hard-coded tax values.</div><Btn onClick={save} disabled={saving}><Save size={14}/> {saving?"Saving…":"Save Tax Settings"}</Btn></SectionCard>;
}

export function AdminTransactions({ currentStaff, branchId="all" }) {
  const {rows,loading}=useCollection("payments",{branchId,order:true}); const [filter,setFilter]=useState("All"); const shown=rows.filter(r=>filter==="All"||r.status===filter); const reconcile=shown.reduce((a,r)=>a+num(r.amount),0);
  const update=async(r,status)=>{
    try {
      if (status === "Refunded") {
        const refundId = `REF-${Date.now()}`;
        await setDoc(doc(db,"refunds",refundId),{id:refundId,paymentId:r.id,orderId:r.orderId||"",orderNumber:r.orderNumber||"",invoiceNumber:r.invoiceNumber||"",branchId,amount:num(r.amount),reason:"Manual refund",status:"Refunded",createdBy:currentStaff?.uid||currentStaff?.id||"unknown",createdAt:serverTimestamp()});
        if (r.invoiceNumber) await updateDoc(doc(db,"invoices",r.invoiceNumber),{status:"Refunded",updatedAt:serverTimestamp()});
      }
      await updateDoc(doc(db,"payments",r.id),{status,updatedAt:serverTimestamp()});
      await audit({staff:currentStaff,action:status==="Refunded"?"REFUND":"PAYMENT_STATUS",module:"Payments",oldValue:r.status,newValue:status,branchId});
    } catch(e) { alert(e?.message||"Payment update failed"); }
  };
  return <SectionCard title="Payment Transactions & Daily Reconciliation" icon={Receipt} right={<div className="p0-inline"><select className="p0-select-small" value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Pending</option><option>Paid</option><option>Partially Paid</option><option>Failed</option><option>Refunded</option></select><b>{money(reconcile)}</b></div>}>{loading?<Loading/>:!shown.length?<Empty/>:<div className="p0-table-wrap"><table className="p0-table"><thead><tr><th>Transaction</th><th>Order</th><th>Method</th><th>Amount</th><th>Status</th><th>Reference</th><th>Action</th></tr></thead><tbody>{shown.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.orderNumber||"—"}</td><td>{r.method}</td><td>{money(r.amount)}</td><td><span className="p0-badge">{r.status}</span></td><td>{r.transactionId||r.upiReference||"—"}</td><td><select className="p0-select-small" value={r.status||"Pending"} onChange={e=>update(r,e.target.value)}><option>Pending</option><option>Paid</option><option>Partially Paid</option><option>Failed</option><option>Refunded</option><option>Cancelled</option></select></td></tr>)}</tbody></table></div>}</SectionCard>;
}

export function AdminInvoices({ currentStaff, branchId="all" }) {
  const { rows, loading } = useCollection("invoices", { branchId, order: true });
  const [prefix, setPrefix] = useState("INV");
  const [saving, setSaving] = useState(false);
  useEffect(() => { getDoc(doc(db,"settings","invoiceSettings")).then(s => s.exists() && setPrefix(s.data().prefix || "INV")).catch(console.error); }, []);
  const savePrefix = async () => {
    const value = clean(prefix).toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 12) || "INV";
    setSaving(true);
    try { await setDoc(doc(db,"settings","invoiceSettings"),{prefix:value,updatedAt:serverTimestamp()},{merge:true}); setPrefix(value); await audit({staff:currentStaff,action:"UPDATE",module:"Invoice",newValue:{prefix:value},branchId}); alert("Invoice prefix saved."); }
    catch(e){ alert(e?.message||"Unable to save invoice prefix"); }
    finally { setSaving(false); }
  };
  const cancel = async r => { if(!window.confirm(`Cancel invoice ${r.invoiceNumber}?`))return; try { await updateDoc(doc(db,"invoices",r.id),{status:"Cancelled",updatedAt:serverTimestamp()}); await audit({staff:currentStaff,action:"CANCEL",module:"Invoice",oldValue:r.status,newValue:"Cancelled",branchId}); } catch(e){alert(e?.message||"Unable to cancel invoice")} };
  return <SectionCard title="Invoice Management" icon={Receipt}>
    <div className="p0-inline" style={{marginBottom:15}}><label className="p0-field" style={{maxWidth:220}}><span>Invoice prefix</span><input value={prefix} onChange={e=>setPrefix(e.target.value)}/></label><Btn onClick={savePrefix} disabled={saving}><Save size={13}/> Save Prefix</Btn></div>
    {loading?<Loading/>:!rows.length?<Empty text="Invoices appear here after POS billing."/>:<div className="p0-table-wrap"><table className="p0-table"><thead><tr><th>Invoice</th><th>Order</th><th>Customer</th><th>Total</th><th>GST</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.invoiceNumber}</td><td>{r.orderNumber}</td><td>{r.customer?.name||"Walk-in"}</td><td>{money(r.total)}</td><td>{r.gstInvoice?"GST":"Customer"}</td><td>{r.status}</td><td><div className="p0-inline"><Btn secondary onClick={()=>printDocument(r.invoiceNumber,invoiceHtml(r))}><Printer size={13}/> Print / PDF</Btn><Btn secondary onClick={()=>downloadText(`${r.invoiceNumber}.html`,invoiceHtml(r),"text/html")}><Download size={13}/> Download</Btn><Btn danger secondary onClick={()=>cancel(r)}>Cancel</Btn></div></td></tr>)}</tbody></table></div>}
  </SectionCard>;
}

function periodRange(period,from,to){const end=new Date();end.setHours(23,59,59,999);let start=new Date();start.setHours(0,0,0,0);if(period==="Yesterday"){start.setDate(start.getDate()-1);end.setDate(end.getDate()-1);end.setHours(23,59,59,999)}else if(period==="This week"){start.setDate(start.getDate()-((start.getDay()+6)%7))}else if(period==="This month"){start.setDate(1)}else if(period==="Custom"&&from&&to){start=new Date(from);end=new Date(to);end.setHours(23,59,59,999)}return [start,end]}
export function AdminReports({ branchId="all" }) {
  const [period,setPeriod]=useState("Today");const [from,setFrom]=useState(dateKey());const [to,setTo]=useState(dateKey());const [refresh,setRefresh]=useState(0);const [data,setData]=useState({orders:[],payments:[],inventory:[],expenses:[],purchases:[]});
  useEffect(()=>{let dead=false;(async()=>{try{const names=["orders","payments","inventory","expenses","purchases"];const out={};for(const n of names){const snap=await getDocs(branchId!=="all"?query(collection(db,n),where("branchId","==",branchId),limit(1000)):query(collection(db,n),limit(1000)));out[n]=snap.docs.map(d=>({id:d.id,...d.data()}));}if(!dead)setData(out)}catch(e){console.error("Reports",e)}})();return()=>{dead=true}},[branchId,refresh]);
  const [start,end]=periodRange(period,from,to);const inRange=r=>{const d=r.createdAt?.toDate?.()||new Date(r.createdAt||r.date||0);return d>=start&&d<=end};const orders=data.orders.filter(inRange);const payments=data.payments.filter(inRange);const revenue=orders.reduce((s,o)=>s+num(o.total),0);const refunds=payments.filter(p=>p.status==="Refunded").reduce((s,p)=>s+num(p.amount),0);const net=revenue-refunds;const rows=[...orders.map(o=>({type:"Order",id:o.orderNumber||o.id,date:o.date||dateKey(),type2:o.type,total:o.total,status:o.status})),...payments.map(p=>({type:"Payment",id:p.id,date:p.date||dateKey(),type2:p.method,total:p.amount,status:p.status}))];const productMap={};orders.forEach(o=>(o.items||[]).forEach(i=>{productMap[i.name]=(productMap[i.name]||0)+num(i.qty)}));const productRows=Object.entries(productMap).map(([product,qty])=>({product,qty}));
  return <div className="p0-page"><SectionCard title="Reports & Analytics" icon={BarChart3} right={<Btn secondary onClick={()=>setRefresh(x=>x+1)}><RefreshCw size={13}/> Refresh</Btn>}><div className="p0-report-filters"><select className="p0-select-small" value={period} onChange={e=>setPeriod(e.target.value)}><option>Today</option><option>Yesterday</option><option>This week</option><option>This month</option><option>Custom</option></select>{period==="Custom"&&<><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></>}<Btn secondary onClick={()=>exportCSV(`restaurant-report-${dateKey()}.csv`,rows)}><Download size={13}/> CSV</Btn><Btn secondary onClick={()=>exportExcel(`restaurant-report-${dateKey()}.xls`,rows)}><Download size={13}/> Excel</Btn><Btn secondary onClick={()=>printDocument("Restaurant Report",`<h1>Restaurant Report</h1><pre>${escapeHtml(JSON.stringify(rows,null,2))}</pre>`)}><Printer size={13}/> PDF / Print</Btn></div><div className="p0-stat-grid"><div><small>Sales / Revenue</small><strong>{money(revenue)}</strong></div><div><small>Net after refunds</small><strong>{money(net)}</strong></div><div><small>Orders</small><strong>{orders.length}</strong></div><div><small>Payments</small><strong>{payments.length}</strong></div></div><div className="p0-report-grid"><ReportList title="Sales report" rows={rows}/><ReportList title="Product report" rows={productRows}/><ReportList title="Payment report" rows={payments.map(p=>({method:p.method,amount:p.amount,status:p.status}))}/><ReportList title="Inventory report" rows={data.inventory.map(i=>({name:i.name,qty:i.qty,unit:i.unit,min:i.min}))}/><ReportList title="Purchase report" rows={data.purchases}/><ReportList title="Expense report" rows={data.expenses}/><ReportList title="Customer report" rows={orders.map(o=>({customer:o.customer?.name||o.customer||"Walk-in",total:o.total,type:o.type}))}/><ReportList title="Delivery report" rows={orders.filter(o=>o.type==="Delivery").map(o=>({order:o.orderNumber,total:o.total,status:o.status}))}/><ReportList title="Branch report" rows={orders.map(o=>({branchId:o.branchId,total:o.total}))}/><ReportList title="Profitability report" rows={productRows}/><ReportList title="Category report" rows={orders.flatMap(o=>o.items||[]).map(i=>({category:i.category||"Uncategorised",qty:i.qty}))}/><ReportList title="GST report" rows={orders.map(o=>({order:o.orderNumber,cgst:o.tax?.cgst||0,sgst:o.tax?.sgst||0,igst:o.tax?.igst||0,tax:o.tax?.amount||0}))}/></div></SectionCard></div>;
}
function ReportList({title,rows}){return <div className="p0-report-card"><strong>{title}</strong>{!rows.length?<small>No data</small>:rows.slice(0,12).map((r,i)=><div key={i}><span>{Object.values(r)[0]}</span><b>{Object.values(r)[1]??""}</b></div>)}</div>}

export function AdminAuditLogs({ branchId="all" }) { const {rows,loading}=useCollection("auditLogs",{branchId,order:true,max:500});return <SectionCard title="Audit Logs" icon={ShieldCheck}>{loading?<Loading/>:!rows.length?<Empty text="No audit activity yet."/>:<div className="p0-table-wrap"><table className="p0-table"><thead><tr><th>Date</th><th>User</th><th>Action</th><th>Module</th><th>Branch</th><th>Details</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.date} {r.time}</td><td>{r.user}</td><td>{r.action}</td><td>{r.module}</td><td>{r.branchId}</td><td>{r.details||"—"}</td></tr>)}</tbody></table></div>}</SectionCard> }

export function AdminBranches({ currentStaff }) { const {rows,loading}=useCollection("branches",{max:100});const [form,setForm]=useState({id:"",code:"",name:"",address:"",phone:"",managerId:"",active:true});const edit=b=>setForm({id:b.id,code:b.code||"",name:b.name||"",address:b.address||"",phone:b.phone||"",managerId:b.managerId||"",active:b.active!==false});const save=async()=>{if(!clean(form.name)||!clean(form.code))return alert("Branch name and code are required.");try{const id=clean(form.id)||`branch-${Date.now()}`;const old=rows.find(x=>x.id===id)||null;await setDoc(doc(db,"branches",id),{...form,id,createdAt:old?.createdAt||serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});await audit({staff:currentStaff,action:old?"UPDATE":"CREATE",module:"Branches",oldValue:old,newValue:form,branchId:id});setForm({id:"",code:"",name:"",address:"",phone:"",managerId:"",active:true})}catch(e){alert(e?.message||"Unable to save branch")}};const disable=async b=>{try{await updateDoc(doc(db,"branches",b.id),{active:false,updatedAt:serverTimestamp()});await audit({staff:currentStaff,action:"DISABLE",module:"Branches",oldValue:b,newValue:{...b,active:false},branchId:b.id})}catch(e){alert(e?.message||"Unable to disable branch")}};return <div className="p0-page"><SectionCard title="Multi-Branch Management" icon={GitBranch}><div className="p0-grid-4"><Field label="Branch code" value={form.code} onChange={v=>setForm({...form,code:v})}/><Field label="Branch name" value={form.name} onChange={v=>setForm({...form,name:v})}/><Field label="Phone" value={form.phone} onChange={v=>setForm({...form,phone:v})}/><Field label="Manager ID" value={form.managerId} onChange={v=>setForm({...form,managerId:v})}/><div className="p0-span-4"><Field label="Address" value={form.address} onChange={v=>setForm({...form,address:v})}/></div></div><div className="p0-actions"><Btn onClick={save}><Save size={14}/> {form.id?"Update Branch":"Add Branch"}</Btn>{form.id&&<Btn secondary onClick={()=>setForm({id:"",code:"",name:"",address:"",phone:"",managerId:"",active:true})}>Cancel</Btn>}</div></SectionCard><SectionCard title={`Branches (${rows.length})`}>{loading?<Loading/>:!rows.length?<Empty text="No branches configured. Add Branch 01–03 as required."/>:<div className="p0-table-wrap"><table className="p0-table"><thead><tr><th>Code</th><th>Name</th><th>Manager</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(b=><tr key={b.id}><td>{b.code}</td><td>{b.name}</td><td>{b.managerId||"—"}</td><td>{b.active===false?"Disabled":"Active"}</td><td><Btn secondary onClick={()=>edit(b)}><RotateCcw size={13}/> Edit</Btn> <Btn danger secondary onClick={()=>disable(b)} disabled={b.active===false}>Disable</Btn></td></tr>)}</tbody></table></div>}</SectionCard></div> }

export function AdminStaffPermissions({ staff=[], setStaff, currentStaff, branchId="all" }) { const [selected,setSelected]=useState(staff[0]?.id||"");const member=staff.find(x=>x.id===selected);const [perms,setPerms]=useState(member?.permissions||ROLE_DEFAULTS[normalizeRole(member?.role)]||[]);useEffect(()=>setPerms(member?.permissions||ROLE_DEFAULTS[normalizeRole(member?.role)]||[]),[selected,member?.role]);const save=async()=>{if(!member)return;try{await setDoc(doc(db,"staff",member.id),{...member,permissions:perms,branchId:member.branchId||branchId,updatedAt:serverTimestamp()},{merge:true});setStaff(c=>c.map(x=>x.id===member.id?{...x,permissions:perms,branchId:x.branchId||branchId}:x));await audit({staff:currentStaff,action:"PERMISSION_CHANGE",module:"Staff",oldValue:member.permissions||[],newValue:perms,branchId});alert("Permissions saved.")}catch(e){alert(e?.message||"Unable to save permissions")}};return <SectionCard title="Role-Based Permissions" icon={ShieldCheck}><div className="p0-grid-2"><label className="p0-field"><span>Staff member</span><select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select staff</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name} · {s.role}</option>)}</select></label><div className="p0-note">Roles are data-driven. For production security, Firebase Rules must enforce the same branch and permission model.</div></div>{member&&<><div className="p0-permission-grid">{P0_PERMISSIONS.map(p=><label key={p} className="p0-check"><input type="checkbox" checked={perms.includes(p)} onChange={e=>setPerms(x=>e.target.checked?[...x,p]:x.filter(y=>y!==p))}/>{p}</label>)}</div><Btn onClick={save}><Save size={14}/> Save Permissions</Btn></>}</SectionCard> }

export function AdminRecipes({
  inventory = [],
  products = [],
  currentStaff,
  branchId = "all"
}) {
  const { rows: recipes, loading } = useCollection("recipes", {
    branchId,
    max: 200
  });

  const emptyForm = {
    id: "",
    name: "",
    productId: "",
    sellingPrice: "",
    ingredients: []
  };

  const [form, setForm] = useState(emptyForm);
  const [ingredient, setIngredient] = useState({
    inventoryId: "",
    qty: "",
    unit: "",
    cost: ""
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedProduct = products.find(
    (p) => String(p.id) === String(form.productId)
  );

  const sellingPrice = num(
    form.sellingPrice || selectedProduct?.price
  );

  const totalCost = form.ingredients.reduce(
    (sum, item) =>
      sum +
      num(item.qty) *
      num(item.cost),
    0
  );

  const foodCostPercentage =
    sellingPrice > 0
      ? (totalCost / sellingPrice) * 100
      : 0;

  const grossMargin =
    sellingPrice - totalCost;

  const resetForm = () => {
    setForm(emptyForm);
    setIngredient({
      inventoryId: "",
      qty: "",
      unit: "",
      cost: ""
    });
    setMessage("");
  };

  const selectIngredient = (inventoryId) => {
    const item = inventory.find(
      (x) => String(x.id) === String(inventoryId)
    );

    setIngredient((current) => ({
      ...current,
      inventoryId,
      unit: current.unit || item?.unit || "kg",
      cost:
        current.cost !== ""
          ? current.cost
          : item?.costPerUnit ??
            item?.cost ??
            ""
    }));
  };

  const addIngredient = () => {
    const item = inventory.find(
      (x) => String(x.id) === String(ingredient.inventoryId)
    );

    const qty = num(ingredient.qty);
    const cost = num(
      ingredient.cost !== ""
        ? ingredient.cost
        : item?.costPerUnit ?? item?.cost
    );

    if (!item) {
      setMessage("Select an ingredient.");
      return;
    }

    if (qty <= 0) {
      setMessage("Enter a valid ingredient quantity.");
      return;
    }

    if (cost < 0) {
      setMessage("Ingredient cost cannot be negative.");
      return;
    }

    const existingIndex = form.ingredients.findIndex(
      (x) =>
        String(x.inventoryId) ===
        String(item.id)
    );

    const newItem = {
      inventoryId: item.id,
      name: item.name || item.item || "Ingredient",
      qty,
      unit:
        clean(ingredient.unit) ||
        item.unit ||
        "kg",
      cost
    };

    setForm((current) => {
      if (existingIndex >= 0) {
        return {
          ...current,
          ingredients: current.ingredients.map(
            (x, index) =>
              index === existingIndex
                ? newItem
                : x
          )
        };
      }

      return {
        ...current,
        ingredients: [
          ...current.ingredients,
          newItem
        ]
      };
    });

    setIngredient({
      inventoryId: "",
      qty: "",
      unit: "",
      cost: ""
    });

    setMessage("");
  };

  const removeIngredient = (index) => {
    setForm((current) => ({
      ...current,
      ingredients:
        current.ingredients.filter(
          (_, i) => i !== index
        )
    }));
  };

  const editRecipe = (recipe) => {
    setForm({
      id: recipe.id || "",
      name: recipe.name || "",
      productId: recipe.productId || "",
      sellingPrice:
        recipe.sellingPrice ?? "",
      ingredients: Array.isArray(
        recipe.ingredients
      )
        ? recipe.ingredients.map((item) => ({
            inventoryId:
              item.inventoryId || "",
            name:
              item.name ||
              item.item ||
              "Ingredient",
            qty: num(item.qty),
            unit:
              item.unit || "kg",
            cost: num(
              item.cost ??
              item.costPerUnit
            )
          }))
        : []
    });

    setMessage(
      `Editing ${recipe.name || "recipe"}.`
    );
  };

  const deleteRecipe = async (recipe) => {
    if (!recipe?.id) return;

    const confirmed = window.confirm(
      `Delete recipe "${recipe.name || recipe.id}"?`
    );

    if (!confirmed) return;

    try {
      await updateDoc(
        doc(db, "recipes", recipe.id),
        {
          deleted: true,
          active: false,
          deletedAt: serverTimestamp(),
          deletedBy:
            currentStaff?.uid ||
            currentStaff?.id ||
            "unknown",
          updatedAt: serverTimestamp()
        }
      );

      await audit({
        staff: currentStaff,
        action: "DELETE",
        module: "Recipe / Food Costing",
        oldValue: recipe,
        newValue: {
          ...recipe,
          deleted: true
        },
        branchId
      });

      if (form.id === recipe.id) {
        resetForm();
      }

      setMessage(
        `Recipe "${recipe.name || recipe.id}" deleted.`
      );
    } catch (error) {
      console.error(error);
      setMessage(
        error?.message ||
        "Unable to delete recipe."
      );
    }
  };

  const save = async () => {
    const recipeName = clean(form.name);

    if (!recipeName) {
      setMessage("Recipe name is required.");
      return;
    }

    if (!form.ingredients.length) {
      setMessage(
        "Add at least one ingredient."
      );
      return;
    }

    if (sellingPrice <= 0) {
      setMessage(
        "Selling price must be greater than zero."
      );
      return;
    }

    if (foodCostPercentage > 100) {
      const continueSave = window.confirm(
        `Food cost is ${foodCostPercentage.toFixed(
          1
        )}%, which is above 100%. Save anyway?`
      );

      if (!continueSave) return;
    }

    setSaving(true);
    setMessage("");

    try {
      const recipeId =
        form.id ||
        form.productId ||
        `recipe-${Date.now()}`;

      const existing = recipes.find(
        (recipe) =>
          String(recipe.id) ===
          String(recipeId)
      );

      const payload = {
        id: recipeId,
        name: recipeName,
        productId:
          form.productId || "",
        branchId:
          branchId || "all",
        ingredients:
          form.ingredients.map(
            (item) => ({
              inventoryId:
                item.inventoryId,
              name: item.name,
              qty: num(item.qty),
              unit:
                item.unit || "kg",
              cost: num(item.cost),
              ingredientCost:
                num(item.qty) *
                num(item.cost)
            })
          ),
        ingredientCount:
          form.ingredients.length,
        totalCost,
        recipeCost: totalCost,
        sellingPrice,
        foodCostPercentage,
        foodCostPercent:
          foodCostPercentage,
        grossMargin,
        profitMargin:
          grossMargin,
        active: true,
        deleted: false,
        createdAt:
          existing?.createdAt ||
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
        updatedBy:
          currentStaff?.uid ||
          currentStaff?.id ||
          "unknown"
      };

      await setDoc(
        doc(db, "recipes", recipeId),
        payload,
        { merge: true }
      );

      await audit({
        staff: currentStaff,
        action: existing
          ? "UPDATE"
          : "CREATE",
        module: "Recipe / Food Costing",
        oldValue: existing || null,
        newValue: payload,
        branchId,
        details:
          `${recipeName} · Recipe Cost ${money(
            totalCost
          )} · Food Cost ${foodCostPercentage.toFixed(
            1
          )}% · Gross Margin ${money(
            grossMargin
          )}`
      });

      setForm(emptyForm);
      setIngredient({
        inventoryId: "",
        qty: "",
        unit: "",
        cost: ""
      });

      setMessage(
        existing
          ? "Recipe updated successfully."
          : "Recipe saved successfully."
      );
    } catch (error) {
      console.error(error);
      setMessage(
        error?.message ||
        "Unable to save recipe."
      );
    } finally {
      setSaving(false);
    }
  };

  const visibleRecipes = recipes.filter(
    (recipe) =>
      recipe.deleted !== true &&
      recipe.active !== false
  );

  return (
    <div className="p0-page">
      <SectionCard
        title="Recipe / Food Costing"
        icon={ChefHat}
        right={
          <div className="p0-inline">
            <span className="p0-badge">
              {visibleRecipes.length} recipes
            </span>
          </div>
        }
      >
        {message && (
          <div
            className="p0-message"
            style={{ marginBottom: 12 }}
          >
            {message}
          </div>
        )}

        <div className="p0-grid-4">
          <Field
            label="Recipe"
            value={form.name}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                name: value
              }))
            }
            placeholder="Chicken Biryani"
          />

          <label className="p0-field">
            <span>Menu product</span>
            <select
              value={form.productId}
              onChange={(event) => {
                const productId =
                  event.target.value;
                const product =
                  products.find(
                    (p) =>
                      String(p.id) ===
                      String(productId)
                  );

                setForm((current) => ({
                  ...current,
                  productId,
                  sellingPrice:
                    current.sellingPrice !== ""
                      ? current.sellingPrice
                      : product?.price ?? ""
                }));
              }}
            >
              <option value="">
                Select product
              </option>
              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Selling price"
            type="number"
            value={form.sellingPrice}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                sellingPrice: value
              }))
            }
            placeholder="280"
          />

          <div className="p0-cost-box">
            <b>
              Recipe Cost {money(totalCost)}
            </b>
            <span>
              Food Cost{" "}
              {foodCostPercentage.toFixed(1)}%
              {" · "}
              Gross Margin{" "}
              {money(grossMargin)}
            </span>
          </div>
        </div>

        <div
          className="p0-grid-4"
          style={{ marginTop: 12 }}
        >
          <label className="p0-field">
            <span>Ingredient</span>
            <select
              value={ingredient.inventoryId}
              onChange={(event) =>
                selectIngredient(
                  event.target.value
                )
              }
            >
              <option value="">
                Select ingredient
              </option>
              {inventory.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name || item.item}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Quantity"
            type="number"
            value={ingredient.qty}
            onChange={(value) =>
              setIngredient((current) => ({
                ...current,
                qty: value
              }))
            }
            placeholder="250"
          />

          <Field
            label="Unit"
            value={ingredient.unit}
            onChange={(value) =>
              setIngredient((current) => ({
                ...current,
                unit: value
              }))
            }
            placeholder="g / kg / ml / pcs"
          />

          <Field
            label="Ingredient cost / unit"
            type="number"
            value={ingredient.cost}
            onChange={(value) =>
              setIngredient((current) => ({
                ...current,
                cost: value
              }))
            }
            placeholder="0.20"
          />
        </div>

        <div className="p0-actions">
          <Btn
            secondary
            onClick={addIngredient}
          >
            <Plus size={14} />
            Add Ingredient
          </Btn>

          {form.id && (
            <Btn
              secondary
              onClick={resetForm}
            >
              <RotateCcw size={14} />
              Cancel Edit
            </Btn>
          )}

          <Btn
            onClick={save}
            disabled={saving}
          >
            <Save size={14} />
            {saving
              ? "Saving…"
              : form.id
                ? "Update Recipe"
                : "Save Recipe"}
          </Btn>
        </div>

        {form.ingredients.length > 0 && (
          <div
            className="p0-ingredient-list"
            style={{ marginTop: 14 }}
          >
            {form.ingredients.map(
              (item, index) => (
                <div
                  key={`${item.inventoryId}-${index}`}
                >
                  <span>
                    <strong>
                      {item.name}
                    </strong>
                    {" · "}
                    {item.qty}{" "}
                    {item.unit}
                    {" · "}
                    {money(item.cost)}
                    {" / "}
                    {item.unit}
                  </span>

                  <b>
                    {money(
                      num(item.qty) *
                      num(item.cost)
                    )}
                  </b>

                  <button
                    type="button"
                    title="Remove ingredient"
                    onClick={() =>
                      removeIngredient(index)
                    }
                  >
                    <X size={13} />
                  </button>
                </div>
              )
            )}
          </div>
        )}

        <div
          className="p0-grid-4"
          style={{ marginTop: 15 }}
        >
          <div className="p0-cost-box">
            <small>Recipe Cost</small>
            <b>{money(totalCost)}</b>
          </div>

          <div className="p0-cost-box">
            <small>Selling Price</small>
            <b>{money(sellingPrice)}</b>
          </div>

          <div className="p0-cost-box">
            <small>Food Cost %</small>
            <b>
              {foodCostPercentage.toFixed(1)}%
            </b>
          </div>

          <div className="p0-cost-box">
            <small>Gross Margin</small>
            <b>{money(grossMargin)}</b>
          </div>
        </div>

        <div
          className="p0-note"
          style={{ marginTop: 14 }}
        >
          Ingredient cost is calculated as
          quantity × cost per unit. Recipe Cost,
          Food Cost %, Selling Price and Gross
          Margin are recalculated automatically.
        </div>
      </SectionCard>

      <SectionCard
        title="Saved Recipes & Food Cost Analysis"
        icon={ChefHat}
      >
        {loading ? (
          <Loading />
        ) : !visibleRecipes.length ? (
          <Empty text="No recipes created yet." />
        ) : (
          <div className="p0-table-wrap">
            <table className="p0-table">
              <thead>
                <tr>
                  <th>Recipe</th>
                  <th>Ingredients</th>
                  <th>Recipe Cost</th>
                  <th>Selling Price</th>
                  <th>Food Cost %</th>
                  <th>Gross Margin</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleRecipes.map(
                  (recipe) => (
                    <tr key={recipe.id}>
                      <td>
                        <strong>
                          {recipe.name}
                        </strong>
                        {recipe.productId && (
                          <div>
                            <small>
                              Product:{" "}
                              {products.find(
                                (p) =>
                                  String(p.id) ===
                                  String(
                                    recipe.productId
                                  )
                              )?.name ||
                                recipe.productId}
                            </small>
                          </div>
                        )}
                      </td>

                      <td>
                        {Array.isArray(
                          recipe.ingredients
                        )
                          ? recipe.ingredients.length
                          : 0}
                      </td>

                      <td>
                        {money(
                          recipe.recipeCost ??
                          recipe.totalCost
                        )}
                      </td>

                      <td>
                        {money(
                          recipe.sellingPrice
                        )}
                      </td>

                      <td>
                        {Number(
                          recipe.foodCostPercentage ??
                          recipe.foodCostPercent ??
                          0
                        ).toFixed(1)}
                        %
                      </td>

                      <td>
                        {money(
                          recipe.grossMargin ??
                          recipe.profitMargin
                        )}
                      </td>

                      <td>
                        <div className="p0-inline">
                          <Btn
                            secondary
                            onClick={() =>
                              editRecipe(recipe)
                            }
                          >
                            Edit
                          </Btn>

                          <Btn
                            secondary
                            danger
                            onClick={() =>
                              deleteRecipe(recipe)
                            }
                          >
                            Delete
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export function AdminPurchasing({
  inventory = [],
  currentStaff,
  branchId = "all"
}) {
  const [tab, setTab] = useState("suppliers");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { rows: suppliers, loading: suppliersLoading } =
    useCollection("suppliers", { branchId, max: 300 });

  const { rows: purchaseOrders, loading: poLoading } =
    useCollection("purchaseOrders", { branchId, max: 300 });

  const { rows: purchases, loading: purchasesLoading } =
    useCollection("purchases", { branchId, order: true, max: 300 });

  const { rows: purchaseReturns, loading: returnsLoading } =
    useCollection("purchaseReturns", { branchId, order: true, max: 300 });

  const { rows: supplierPayments, loading: supplierPaymentsLoading } =
    useCollection("supplierPayments", { branchId, order: true, max: 300 });

  const [supplierForm, setSupplierForm] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    gstin: ""
  });

  const [poForm, setPoForm] = useState({
    id: "",
    supplierId: "",
    expectedDate: "",
    notes: "",
    items: []
  });

  const [poItem, setPoItem] = useState({
    inventoryId: "",
    qty: "",
    unit: "",
    unitCost: ""
  });

  const [receiveForm, setReceiveForm] = useState({
    purchaseOrderId: "",
    items: []
  });

  const [returnForm, setReturnForm] = useState({
    supplierId: "",
    inventoryId: "",
    qty: "",
    unit: "",
    unitCost: "",
    reason: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    supplierId: "",
    amount: "",
    method: "Cash",
    reference: "",
    notes: ""
  });

  const getInventoryItem = (inventoryId) =>
    inventory.find(
      (item) => String(item.id) === String(inventoryId)
    );

  const getSupplier = (supplierId) =>
    suppliers.find(
      (supplier) => String(supplier.id) === String(supplierId)
    );

  const supplierLedger = useMemo(() => {
    return suppliers.map((supplier) => {
      const supplierPurchases = purchases
        .filter(
          (purchase) =>
            String(purchase.supplierId) ===
            String(supplier.id)
        )
        .reduce(
          (sum, purchase) =>
            sum + num(purchase.total),
          0
        );

      const supplierReturns = purchaseReturns
        .filter(
          (item) =>
            String(item.supplierId) ===
            String(supplier.id)
        )
        .reduce(
          (sum, item) =>
            sum + num(item.total),
          0
        );

      const supplierPaid = supplierPayments
        .filter(
          (payment) =>
            String(payment.supplierId) ===
            String(supplier.id)
        )
        .reduce(
          (sum, payment) =>
            sum + num(payment.amount),
          0
        );

      return {
        ...supplier,
        purchaseTotal: supplierPurchases,
        returnTotal: supplierReturns,
        paidTotal: supplierPaid,
        payable: Math.max(
          0,
          supplierPurchases -
            supplierReturns -
            supplierPaid
        )
      };
    });
  }, [
    suppliers,
    purchases,
    purchaseReturns,
    supplierPayments
  ]);

  const resetSupplier = () =>
    setSupplierForm({
      id: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      gstin: ""
    });

  const saveSupplier = async () => {
    const name = clean(supplierForm.name);

    if (!name) {
      setMessage("Supplier name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const id =
        supplierForm.id ||
        `SUP-${Date.now()}`;

      const existing = suppliers.find(
        (supplier) =>
          String(supplier.id) === String(id)
      );

      const payload = {
        id,
        name,
        phone: clean(supplierForm.phone),
        email: clean(supplierForm.email),
        address: clean(supplierForm.address),
        gstin: clean(supplierForm.gstin),
        branchId: branchId || "all",
        active: true,
        createdAt:
          existing?.createdAt ||
          serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(
        doc(db, "suppliers", id),
        payload,
        { merge: true }
      );

      await audit({
        staff: currentStaff,
        action: existing ? "UPDATE" : "CREATE",
        module: "Purchasing / Suppliers",
        oldValue: existing || null,
        newValue: payload,
        branchId
      });

      resetSupplier();
      setMessage(
        existing
          ? "Supplier updated successfully."
          : "Supplier added successfully."
      );
    } catch (error) {
      console.error("Supplier save failed:", error);
      setMessage(
        error?.message ||
        "Unable to save supplier."
      );
    } finally {
      setSaving(false);
    }
  };

  const deactivateSupplier = async (supplier) => {
    if (!supplier?.id) return;

    if (
      !window.confirm(
        `Deactivate supplier "${supplier.name}"? Existing purchase history will be preserved.`
      )
    ) {
      return;
    }

    try {
      await updateDoc(
        doc(db, "suppliers", supplier.id),
        {
          active: false,
          updatedAt: serverTimestamp()
        }
      );

      await audit({
        staff: currentStaff,
        action: "DEACTIVATE",
        module: "Purchasing / Suppliers",
        oldValue: supplier,
        newValue: {
          ...supplier,
          active: false
        },
        branchId
      });

      setMessage(
        "Supplier deactivated. Existing purchase history was preserved."
      );
    } catch (error) {
      console.error("Supplier deactivation failed:", error);
      setMessage(
        error?.message ||
        "Unable to deactivate supplier."
      );
    }
  };

  const addPoItem = () => {
    const item = getInventoryItem(
      poItem.inventoryId
    );
    const qty = num(poItem.qty);
    const unitCost = num(poItem.unitCost);

    if (!item) {
      setMessage("Select an inventory item.");
      return;
    }

    if (qty <= 0) {
      setMessage("Purchase quantity must be greater than zero.");
      return;
    }

    if (unitCost < 0) {
      setMessage("Unit cost cannot be negative.");
      return;
    }

    const row = {
      inventoryId: item.id,
      name: item.name || item.item || "Item",
      qty,
      receivedQty: 0,
      unit:
        clean(poItem.unit) ||
        item.unit ||
        "kg",
      unitCost,
      total: qty * unitCost
    };

    setPoForm((current) => ({
      ...current,
      items: [
        ...current.items.filter(
          (x) =>
            String(x.inventoryId) !==
            String(item.id)
        ),
        row
      ]
    }));

    setPoItem({
      inventoryId: "",
      qty: "",
      unit: "",
      unitCost: ""
    });

    setMessage("");
  };

  const removePoItem = (inventoryId) => {
    setPoForm((current) => ({
      ...current,
      items: current.items.filter(
        (item) =>
          String(item.inventoryId) !==
          String(inventoryId)
      )
    }));
  };

  const poTotal = poForm.items.reduce(
    (sum, item) =>
      sum +
      num(item.qty) *
      num(item.unitCost),
    0
  );

  const savePurchaseOrder = async () => {
    if (!clean(poForm.supplierId)) {
      setMessage("Select a supplier.");
      return;
    }

    if (!poForm.items.length) {
      setMessage(
        "Add at least one item to the purchase order."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const id =
        poForm.id ||
        `PO-${Date.now()}`;

      const existing = purchaseOrders.find(
        (po) =>
          String(po.id) === String(id)
      );

      const payload = {
        id,
        poNumber: id,
        supplierId: poForm.supplierId,
        supplierName:
          getSupplier(poForm.supplierId)?.name ||
          "Supplier",
        branchId: branchId || "all",
        expectedDate:
          clean(poForm.expectedDate),
        notes: clean(poForm.notes),
        items: poForm.items.map(
          (item) => ({
            ...item,
            qty: num(item.qty),
            receivedQty: num(
              item.receivedQty
            ),
            unitCost: num(item.unitCost),
            total:
              num(item.qty) *
              num(item.unitCost)
          })
        ),
        total: poTotal,
        status:
          existing?.status || "Draft",
        createdAt:
          existing?.createdAt ||
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
        createdBy:
          existing?.createdBy ||
          currentStaff?.uid ||
          currentStaff?.id ||
          "unknown"
      };

      await setDoc(
        doc(db, "purchaseOrders", id),
        payload,
        { merge: true }
      );

      await audit({
        staff: currentStaff,
        action: existing ? "UPDATE" : "CREATE",
        module: "Purchasing / Purchase Orders",
        oldValue: existing || null,
        newValue: payload,
        branchId,
        details: `Purchase Order ${id}`
      });

      setPoForm({
        id: "",
        supplierId: "",
        expectedDate: "",
        notes: "",
        items: []
      });

      setMessage(
        existing
          ? "Purchase order updated successfully."
          : `Purchase order ${id} created successfully.`
      );
    } catch (error) {
      console.error("Purchase order save failed:", error);
      setMessage(
        error?.message ||
        "Unable to save purchase order."
      );
    } finally {
      setSaving(false);
    }
  };

  const editPurchaseOrder = (po) => {
    if (
      !["Draft", "Ordered", "Partially Received"].includes(
        po.status
      )
    ) {
      setMessage(
        "Only Draft, Ordered or Partially Received purchase orders can be edited."
      );
      return;
    }

    setPoForm({
      id: po.id || "",
      supplierId: po.supplierId || "",
      expectedDate:
        po.expectedDate || "",
      notes: po.notes || "",
      items: Array.isArray(po.items)
        ? po.items.map((item) => ({
            ...item,
            qty: num(item.qty),
            receivedQty: num(
              item.receivedQty
            ),
            unitCost: num(
              item.unitCost
            )
          }))
        : []
    });

    setTab("purchase-orders");
    setMessage(
      `Editing purchase order ${po.poNumber || po.id}.`
    );
  };

  const updatePoStatus = async (po, status) => {
    if (!po?.id) return;

    if (
      status === "Cancelled" &&
      !window.confirm(
        `Cancel purchase order ${po.poNumber || po.id}?`
      )
    ) {
      return;
    }

    try {
      await updateDoc(
        doc(db, "purchaseOrders", po.id),
        {
          status,
          updatedAt: serverTimestamp()
        }
      );

      await audit({
        staff: currentStaff,
        action: `PO_${status.toUpperCase().replace(/\s+/g, "_")}`,
        module: "Purchasing / Purchase Orders",
        oldValue: po.status,
        newValue: status,
        branchId
      });

      setMessage(
        `Purchase order ${po.poNumber || po.id} marked ${status}.`
      );
    } catch (error) {
      console.error("Purchase order status update failed:", error);
      setMessage(
        error?.message ||
        "Unable to update purchase order."
      );
    }
  };

  const selectedReceivePo =
    purchaseOrders.find(
      (po) =>
        String(po.id) ===
        String(receiveForm.purchaseOrderId)
    ) || null;

  const selectReceivePo = (poId) => {
    const po = purchaseOrders.find(
      (item) =>
        String(item.id) ===
        String(poId)
    );

    setReceiveForm({
      purchaseOrderId: poId,
      items: po?.items
        ? po.items
            .map((item) => ({
              ...item,
              receiveQty: Math.max(
                0,
                num(item.qty) -
                  num(item.receivedQty)
              )
            }))
            .filter(
              (item) =>
                num(item.qty) >
                num(item.receivedQty)
            )
        : []
    });

    setMessage("");
  };

  const receiveStock = async () => {
    if (!selectedReceivePo) {
      setMessage(
        "Select a purchase order to receive."
      );
      return;
    }

    const rows = receiveForm.items
      .map((item) => ({
        ...item,
        receiveQty: num(
          item.receiveQty
        )
      }))
      .filter(
        (item) =>
          item.receiveQty > 0
      );

    if (!rows.length) {
      setMessage(
        "Enter at least one quantity to receive."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const receiptId =
        `PUR-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`;

      const receiptTotal = rows.reduce(
        (sum, item) =>
          sum +
          item.receiveQty *
          num(item.unitCost),
        0
      );

      await runTransaction(
        db,
        async (tx) => {
          const inventoryRefs =
            rows.map((item) =>
              doc(
                db,
                "inventory",
                item.inventoryId
              )
            );

          const inventorySnaps =
            await Promise.all(
              inventoryRefs.map((ref) =>
                tx.get(ref)
              )
            );

          inventorySnaps.forEach(
            (snap, index) => {
              const item =
                rows[index];

              if (!snap.exists()) {
                throw new Error(
                  `Inventory item "${item.name}" was not found.`
                );
              }

              const data =
                snap.data() || {};

              const currentQty = num(
                data.qty ??
                  data.stock
              );

              const nextQty =
                currentQty +
                item.receiveQty;

              tx.update(
                snap.ref,
                {
                  qty: nextQty,
                  stock: nextQty,
                  lastPurchaseCost:
                    num(item.unitCost),
                  supplierId:
                    selectedReceivePo.supplierId ||
                    "",
                  updatedAt:
                    serverTimestamp(),
                  updated:
                    "Purchase received"
                }
              );
            }
          );

          const poRef = doc(
            db,
            "purchaseOrders",
            selectedReceivePo.id
          );

          const nextItems =
            (selectedReceivePo.items ||
              []).map((poItem) => {
              const received =
                rows.find(
                  (row) =>
                    String(
                      row.inventoryId
                    ) ===
                    String(
                      poItem.inventoryId
                    )
                );

              return {
                ...poItem,
                receivedQty:
                  Math.min(
                    num(poItem.qty),
                    num(
                      poItem.receivedQty
                    ) +
                      num(
                        received?.receiveQty
                      )
                  )
              };
            });

          const allReceived =
            nextItems.length > 0 &&
            nextItems.every(
              (item) =>
                num(item.receivedQty) >=
                num(item.qty)
            );

          const anyReceived =
            nextItems.some(
              (item) =>
                num(item.receivedQty) > 0
            );

          tx.update(poRef, {
            items: nextItems,
            status: allReceived
              ? "Received"
              : anyReceived
                ? "Partially Received"
                : selectedReceivePo.status,
            updatedAt:
              serverTimestamp(),
            lastReceivedAt:
              serverTimestamp()
          });

          tx.set(
            doc(
              db,
              "purchases",
              receiptId
            ),
            {
              id: receiptId,
              purchaseNumber:
                receiptId,
              purchaseOrderId:
                selectedReceivePo.id,
              poNumber:
                selectedReceivePo.poNumber ||
                selectedReceivePo.id,
              supplierId:
                selectedReceivePo.supplierId,
              supplierName:
                selectedReceivePo.supplierName ||
                getSupplier(
                  selectedReceivePo.supplierId
                )?.name ||
                "Supplier",
              branchId:
                branchId || "all",
              items: rows.map(
                (item) => ({
                  inventoryId:
                    item.inventoryId,
                  name: item.name,
                  qty:
                    item.receiveQty,
                  unit:
                    item.unit ||
                    "kg",
                  unitCost:
                    num(item.unitCost),
                  total:
                    item.receiveQty *
                    num(item.unitCost)
                })
              ),
              total: receiptTotal,
              status: "Received",
              createdBy:
                currentStaff?.uid ||
                currentStaff?.id ||
                "unknown",
              createdAt:
                serverTimestamp(),
              updatedAt:
                serverTimestamp()
            }
          );
        }
      );

      await audit({
        staff: currentStaff,
        action: "RECEIVE_STOCK",
        module: "Purchasing / Receive Stock",
        newValue: {
          purchaseOrderId:
            selectedReceivePo.id,
          receiptId,
          total: receiptTotal,
          items: rows
        },
        branchId,
        details:
          `Received stock against ${selectedReceivePo.poNumber || selectedReceivePo.id}`
      });

      setReceiveForm({
        purchaseOrderId: "",
        items: []
      });

      setMessage(
        `Stock received successfully. Purchase ${receiptId} created.`
      );
    } catch (error) {
      console.error("Receive stock failed:", error);
      setMessage(
        error?.message ||
        "Unable to receive stock."
      );
    } finally {
      setSaving(false);
    }
  };

  const createPurchaseReturn = async () => {
    const supplierId =
      clean(returnForm.supplierId);

    const inventoryId =
      clean(returnForm.inventoryId);

    const qty =
      num(returnForm.qty);

    const unitCost =
      num(returnForm.unitCost);

    if (!supplierId) {
      setMessage("Select a supplier.");
      return;
    }

    if (!inventoryId) {
      setMessage("Select an inventory item.");
      return;
    }

    if (qty <= 0) {
      setMessage(
        "Return quantity must be greater than zero."
      );
      return;
    }

    const item =
      getInventoryItem(inventoryId);

    if (!item) {
      setMessage(
        "Selected inventory item was not found."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const returnId =
        `PR-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`;

      const total =
        qty * unitCost;

      await runTransaction(
        db,
        async (tx) => {
          const inventoryRef =
            doc(
              db,
              "inventory",
              inventoryId
            );

          const inventorySnap =
            await tx.get(
              inventoryRef
            );

          if (!inventorySnap.exists()) {
            throw new Error(
              "Inventory item was not found."
            );
          }

          const data =
            inventorySnap.data() ||
            {};

          const currentQty =
            num(
              data.qty ??
                data.stock
            );

          if (qty > currentQty) {
            throw new Error(
              `Cannot return ${qty} ${returnForm.unit || item.unit || ""}. Available stock is ${currentQty} ${item.unit || ""}.`
            );
          }

          const nextQty =
            currentQty - qty;

          tx.update(
            inventoryRef,
            {
              qty: nextQty,
              stock: nextQty,
              updatedAt:
                serverTimestamp(),
              updated:
                "Purchase return"
            }
          );

          tx.set(
            doc(
              db,
              "purchaseReturns",
              returnId
            ),
            {
              id: returnId,
              returnNumber:
                returnId,
              supplierId,
              supplierName:
                getSupplier(
                  supplierId
                )?.name ||
                "Supplier",
              branchId:
                branchId || "all",
              inventoryId,
              itemName:
                item.name ||
                item.item ||
                "Item",
              qty,
              unit:
                clean(
                  returnForm.unit
                ) ||
                item.unit ||
                "kg",
              unitCost,
              total,
              reason:
                clean(
                  returnForm.reason
                ) ||
                "Purchase return",
              status: "Returned",
              createdBy:
                currentStaff?.uid ||
                currentStaff?.id ||
                "unknown",
              createdAt:
                serverTimestamp(),
              updatedAt:
                serverTimestamp()
            }
          );
        }
      );

      await audit({
        staff: currentStaff,
        action: "PURCHASE_RETURN",
        module: "Purchasing / Purchase Returns",
        newValue: {
          returnId,
          supplierId,
          inventoryId,
          qty,
          total
        },
        branchId,
        details:
          clean(returnForm.reason) ||
          "Purchase return"
      });

      setReturnForm({
        supplierId: "",
        inventoryId: "",
        qty: "",
        unit: "",
        unitCost: "",
        reason: ""
      });

      setMessage(
        `Purchase return ${returnId} created successfully.`
      );
    } catch (error) {
      console.error("Purchase return failed:", error);
      setMessage(
        error?.message ||
        "Unable to create purchase return."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSupplierPayment = async () => {
    const supplierId =
      clean(paymentForm.supplierId);

    const amount =
      num(paymentForm.amount);

    if (!supplierId) {
      setMessage("Select a supplier.");
      return;
    }

    if (amount <= 0) {
      setMessage(
        "Supplier payment amount must be greater than zero."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const paymentId =
        `SP-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`;

      const payload = {
        id: paymentId,
        paymentNumber: paymentId,
        supplierId,
        supplierName:
          getSupplier(
            supplierId
          )?.name ||
          "Supplier",
        branchId:
          branchId || "all",
        amount,
        method:
          paymentForm.method ||
          "Cash",
        reference:
          clean(
            paymentForm.reference
          ),
        notes:
          clean(
            paymentForm.notes
          ),
        status: "Paid",
        createdBy:
          currentStaff?.uid ||
          currentStaff?.id ||
          "unknown",
        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp()
      };

      await setDoc(
        doc(
          db,
          "supplierPayments",
          paymentId
        ),
        payload
      );

      await audit({
        staff: currentStaff,
        action: "SUPPLIER_PAYMENT",
        module: "Purchasing / Supplier Payments",
        newValue: payload,
        branchId
      });

      setPaymentForm({
        supplierId: "",
        amount: "",
        method: "Cash",
        reference: "",
        notes: ""
      });

      setMessage(
        `Supplier payment ${paymentId} recorded successfully.`
      );
    } catch (error) {
      console.error("Supplier payment failed:", error);
      setMessage(
        error?.message ||
        "Unable to record supplier payment."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateReceiveQty = (
    inventoryId,
    value
  ) => {
    setReceiveForm((current) => ({
      ...current,
      items: current.items.map(
        (item) =>
          String(item.inventoryId) ===
          String(inventoryId)
            ? {
                ...item,
                receiveQty: value
              }
            : item
      )
    }));
  };

  const activeSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.active !== false
    );

  const activePurchaseOrders =
    purchaseOrders.filter(
      (po) =>
        !["Received", "Cancelled"].includes(
          String(po.status || "")
        )
    );

  return (
    <div className="p0-page">
      <SectionCard
        title="Purchasing"
        icon={Receipt}
        right={
          <span className="p0-badge">
            {activeSuppliers.length} suppliers
          </span>
        }
      >
        {message && (
          <div
            className="p0-message"
            style={{ marginBottom: 12 }}
          >
            {message}
          </div>
        )}

        <div className="p0-tabs p0-tabs-scroll">
          {[
            ["suppliers", "Suppliers"],
            ["purchase-orders", "Purchase Orders"],
            ["purchases", "Purchases"],
            ["receive-stock", "Receive Stock"],
            ["purchase-returns", "Purchase Returns"],
            ["supplier-payments", "Supplier Payments"]
          ].map(([value, label]) => (
            <button
              key={value}
              className={
                tab === value
                  ? "active"
                  : ""
              }
              onClick={() =>
                setTab(value)
              }
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "suppliers" && (
          <>
            <div className="p0-grid-4">
              <Field
                label="Supplier name"
                value={supplierForm.name}
                onChange={(value) =>
                  setSupplierForm(
                    (current) => ({
                      ...current,
                      name: value
                    })
                  )
                }
                placeholder="ABC Foods Supplier"
              />
              <Field
                label="Phone"
                value={supplierForm.phone}
                onChange={(value) =>
                  setSupplierForm(
                    (current) => ({
                      ...current,
                      phone: value
                    })
                  )
                }
              />
              <Field
                label="Email"
                value={supplierForm.email}
                onChange={(value) =>
                  setSupplierForm(
                    (current) => ({
                      ...current,
                      email: value
                    })
                  )
                }
              />
              <Field
                label="GSTIN"
                value={supplierForm.gstin}
                onChange={(value) =>
                  setSupplierForm(
                    (current) => ({
                      ...current,
                      gstin: value
                    })
                  )
                }
              />
              <div className="p0-span-4">
                <Field
                  label="Address"
                  value={supplierForm.address}
                  onChange={(value) =>
                    setSupplierForm(
                      (current) => ({
                        ...current,
                        address: value
                      })
                    )
                  }
                />
              </div>
            </div>

            <div className="p0-actions">
              <Btn
                onClick={saveSupplier}
                disabled={saving}
              >
                <Save size={14} />
                {saving
                  ? "Saving…"
                  : supplierForm.id
                    ? "Update Supplier"
                    : "Add Supplier"}
              </Btn>

              {supplierForm.id && (
                <Btn
                  secondary
                  onClick={resetSupplier}
                >
                  <RotateCcw size={14} />
                  Cancel Edit
                </Btn>
              )}
            </div>

            {suppliersLoading ? (
              <Loading />
            ) : !suppliers.length ? (
              <Empty text="No suppliers found." />
            ) : (
              <div className="p0-table-wrap">
                <table className="p0-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Phone</th>
                      <th>GSTIN</th>
                      <th>Purchases</th>
                      <th>Paid</th>
                      <th>Payable</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierLedger.map(
                      (supplier) => (
                        <tr key={supplier.id}>
                          <td>
                            <strong>
                              {supplier.name}
                            </strong>
                            <div>
                              <small>
                                {supplier.address ||
                                  "—"}
                              </small>
                            </div>
                          </td>
                          <td>
                            {supplier.phone ||
                              "—"}
                          </td>
                          <td>
                            {supplier.gstin ||
                              "—"}
                          </td>
                          <td>
                            {money(
                              supplier.purchaseTotal
                            )}
                          </td>
                          <td>
                            {money(
                              supplier.paidTotal
                            )}
                          </td>
                          <td>
                            {money(
                              supplier.payable
                            )}
                          </td>
                          <td>
                            {supplier.active ===
                            false
                              ? "Inactive"
                              : "Active"}
                          </td>
                          <td>
                            <div className="p0-inline">
                              <Btn
                                secondary
                                onClick={() =>
                                  setSupplierForm(
                                    {
                                      id:
                                        supplier.id,
                                      name:
                                        supplier.name ||
                                        "",
                                      phone:
                                        supplier.phone ||
                                        "",
                                      email:
                                        supplier.email ||
                                        "",
                                      address:
                                        supplier.address ||
                                        "",
                                      gstin:
                                        supplier.gstin ||
                                        ""
                                    }
                                  )
                                }
                              >
                                Edit
                              </Btn>
                              {supplier.active !==
                                false && (
                                <Btn
                                  secondary
                                  danger
                                  onClick={() =>
                                    deactivateSupplier(
                                      supplier
                                    )
                                  }
                                >
                                  Deactivate
                                </Btn>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "purchase-orders" && (
          <>
            <div className="p0-grid-4">
              <label className="p0-field">
                <span>Supplier</span>
                <select
                  value={
                    poForm.supplierId
                  }
                  onChange={(event) =>
                    setPoForm(
                      (current) => ({
                        ...current,
                        supplierId:
                          event.target.value
                      })
                    )
                  }
                >
                  <option value="">
                    Select supplier
                  </option>
                  {activeSuppliers.map(
                    (supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <Field
                label="Expected date"
                type="date"
                value={
                  poForm.expectedDate
                }
                onChange={(value) =>
                  setPoForm(
                    (current) => ({
                      ...current,
                      expectedDate:
                        value
                    })
                  )
                }
              />

              <div className="p0-cost-box">
                <small>PO Total</small>
                <b>
                  {money(poTotal)}
                </b>
              </div>

              <div className="p0-note">
                Flow: Draft → Ordered →
                Receive Stock →
                Partially Received /
                Received
              </div>
            </div>

            <div className="p0-grid-4">
              <label className="p0-field">
                <span>Inventory item</span>
                <select
                  value={
                    poItem.inventoryId
                  }
                  onChange={(event) => {
                    const item =
                      getInventoryItem(
                        event.target.value
                      );
                    setPoItem(
                      (current) => ({
                        ...current,
                        inventoryId:
                          event.target.value,
                        unit:
                          current.unit ||
                          item?.unit ||
                          ""
                      })
                    );
                  }}
                >
                  <option value="">
                    Select item
                  </option>
                  {inventory.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name ||
                          item.item}
                      </option>
                    )
                  )}
                </select>
              </label>

              <Field
                label="Quantity"
                type="number"
                value={poItem.qty}
                onChange={(value) =>
                  setPoItem(
                    (current) => ({
                      ...current,
                      qty: value
                    })
                  )
                }
              />

              <Field
                label="Unit"
                value={poItem.unit}
                onChange={(value) =>
                  setPoItem(
                    (current) => ({
                      ...current,
                      unit: value
                    })
                  )
                }
                placeholder="kg / pcs / litres"
              />

              <Field
                label="Unit cost"
                type="number"
                value={
                  poItem.unitCost
                }
                onChange={(value) =>
                  setPoItem(
                    (current) => ({
                      ...current,
                      unitCost: value
                    })
                  )
                }
              />
            </div>

            <div className="p0-actions">
              <Btn
                secondary
                onClick={addPoItem}
              >
                <Plus size={14} />
                Add PO Item
              </Btn>
            </div>

            {poForm.items.length > 0 && (
              <div className="p0-table-wrap">
                <table className="p0-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Unit Cost</th>
                      <th>Total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {poForm.items.map(
                      (item) => (
                        <tr
                          key={
                            item.inventoryId
                          }
                        >
                          <td>
                            {item.name}
                          </td>
                          <td>
                            {item.qty}
                          </td>
                          <td>
                            {item.unit}
                          </td>
                          <td>
                            {money(
                              item.unitCost
                            )}
                          </td>
                          <td>
                            {money(
                              item.qty *
                                item.unitCost
                            )}
                          </td>
                          <td>
                            <Btn
                              secondary
                              danger
                              onClick={() =>
                                removePoItem(
                                  item.inventoryId
                                )
                              }
                            >
                              Remove
                            </Btn>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p0-actions">
              <Btn
                onClick={savePurchaseOrder}
                disabled={saving}
              >
                <Save size={14} />
                {saving
                  ? "Saving…"
                  : poForm.id
                    ? "Update Purchase Order"
                    : "Create Purchase Order"}
              </Btn>

              {poForm.id && (
                <Btn
                  secondary
                  onClick={() =>
                    setPoForm({
                      id: "",
                      supplierId: "",
                      expectedDate: "",
                      notes: "",
                      items: []
                    })
                  }
                >
                  <RotateCcw size={14} />
                  Cancel Edit
                </Btn>
              )}
            </div>

            {poLoading ? (
              <Loading />
            ) : !purchaseOrders.length ? (
              <Empty text="No purchase orders found." />
            ) : (
              <div className="p0-table-wrap">
                <table className="p0-table">
                  <thead>
                    <tr>
                      <th>PO</th>
                      <th>Supplier</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Expected</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map(
                      (po) => (
                        <tr key={po.id}>
                          <td>
                            <strong>
                              {po.poNumber ||
                                po.id}
                            </strong>
                          </td>
                          <td>
                            {po.supplierName ||
                              getSupplier(
                                po.supplierId
                              )?.name ||
                              "Supplier"}
                          </td>
                          <td>
                            {(po.items || [])
                              .length}
                          </td>
                          <td>
                            {money(
                              po.total
                            )}
                          </td>
                          <td>
                            {po.expectedDate ||
                              "—"}
                          </td>
                          <td>
                            <span className="p0-badge">
                              {po.status ||
                                "Draft"}
                            </span>
                          </td>
                          <td>
                            <div className="p0-inline">
                              {[
                                "Draft",
                                "Ordered",
                                "Partially Received"
                              ].includes(
                                po.status
                              ) && (
                                <Btn
                                  secondary
                                  onClick={() =>
                                    editPurchaseOrder(
                                      po
                                    )
                                  }
                                >
                                  Edit
                                </Btn>
                              )}

                              {po.status ===
                                "Draft" && (
                                <Btn
                                  secondary
                                  onClick={() =>
                                    updatePoStatus(
                                      po,
                                      "Ordered"
                                    )
                                  }
                                >
                                  Mark Ordered
                                </Btn>
                              )}

                              {[
                                "Draft",
                                "Ordered",
                                "Partially Received"
                              ].includes(
                                po.status
                              ) && (
                                <Btn
                                  secondary
                                  onClick={() =>
                                    selectReceivePo(
                                      po.id
                                    ) ||
                                    setTab(
                                      "receive-stock"
                                    )
                                  }
                                >
                                  Receive
                                </Btn>
                              )}

                              {![
                                "Received",
                                "Cancelled"
                              ].includes(
                                po.status
                              ) && (
                                <Btn
                                  secondary
                                  danger
                                  onClick={() =>
                                    updatePoStatus(
                                      po,
                                      "Cancelled"
                                    )
                                  }
                                >
                                  Cancel
                                </Btn>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "purchases" && (
          <>
            {purchasesLoading ? (
              <Loading />
            ) : !purchases.length ? (
              <Empty text="No purchases received yet. Receive stock against a Purchase Order." />
            ) : (
              <div className="p0-table-wrap">
                <table className="p0-table">
                  <thead>
                    <tr>
                      <th>Purchase</th>
                      <th>PO</th>
                      <th>Supplier</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(
                      (purchase) => (
                        <tr
                          key={purchase.id}
                        >
                          <td>
                            <strong>
                              {purchase.purchaseNumber ||
                                purchase.id}
                            </strong>
                          </td>
                          <td>
                            {purchase.poNumber ||
                              purchase.purchaseOrderId ||
                              "—"}
                          </td>
                          <td>
                            {purchase.supplierName ||
                              "Supplier"}
                          </td>
                          <td>
                            {(purchase.items ||
                              [])
                              .length}
                          </td>
                          <td>
                            {money(
                              purchase.total
                            )}
                          </td>
                          <td>
                            <span className="p0-badge">
                              {purchase.status ||
                                "Received"}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "receive-stock" && (
          <>
            <div className="p0-grid-2">
              <label className="p0-field">
                <span>Purchase Order</span>
                <select
                  value={
                    receiveForm.purchaseOrderId
                  }
                  onChange={(event) =>
                    selectReceivePo(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select PO
                  </option>
                  {activePurchaseOrders.map(
                    (po) => (
                      <option
                        key={po.id}
                        value={po.id}
                      >
                        {po.poNumber ||
                          po.id} ·{" "}
                        {po.supplierName ||
                          "Supplier"} ·{" "}
                        {po.status ||
                          "Draft"}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="p0-note">
                Receiving stock increases
                inventory only after the
                Firestore transaction succeeds.
              </div>
            </div>

            {selectedReceivePo &&
              receiveForm.items.length > 0 && (
                <div className="p0-table-wrap">
                  <table className="p0-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Ordered</th>
                        <th>Already Received</th>
                        <th>Remaining</th>
                        <th>Receive Now</th>
                        <th>Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveForm.items.map(
                        (item) => (
                          <tr
                            key={
                              item.inventoryId
                            }
                          >
                            <td>
                              {item.name}
                            </td>
                            <td>
                              {item.qty}{" "}
                              {item.unit}
                            </td>
                            <td>
                              {item.receivedQty ||
                                0}{" "}
                              {item.unit}
                            </td>
                            <td>
                              {Math.max(
                                0,
                                num(
                                  item.qty
                                ) -
                                  num(
                                    item.receivedQty
                                  )
                              )}{" "}
                              {item.unit}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max={Math.max(
                                  0,
                                  num(
                                    item.qty
                                  ) -
                                    num(
                                      item.receivedQty
                                    )
                                )}
                                value={
                                  item.receiveQty
                                }
                                onChange={(event) =>
                                  updateReceiveQty(
                                    item.inventoryId,
                                    event.target
                                      .value
                                  )
                                }
                              />
                            </td>
                            <td>
                              {money(
                                item.unitCost
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            {selectedReceivePo &&
              !receiveForm.items.length && (
                <Empty text="This purchase order has no remaining quantity to receive." />
              )}

            <div className="p0-actions">
              <Btn
                onClick={receiveStock}
                disabled={
                  saving ||
                  !selectedReceivePo ||
                  !receiveForm.items.length
                }
              >
                <Check size={14} />
                {saving
                  ? "Receiving…"
                  : "Receive Stock"}
              </Btn>
            </div>
          </>
        )}

        {tab === "purchase-returns" && (
          <>
            <div className="p0-grid-4">
              <label className="p0-field">
                <span>Supplier</span>
                <select
                  value={
                    returnForm.supplierId
                  }
                  onChange={(event) =>
                    setReturnForm(
                      (current) => ({
                        ...current,
                        supplierId:
                          event.target.value
                      })
                    )
                  }
                >
                  <option value="">
                    Select supplier
                  </option>
                  {activeSuppliers.map(
                    (supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="p0-field">
                <span>Inventory item</span>
                <select
                  value={
                    returnForm.inventoryId
                  }
                  onChange={(event) => {
                    const item =
                      getInventoryItem(
                        event.target.value
                      );

                    setReturnForm(
                      (current) => ({
                        ...current,
                        inventoryId:
                          event.target.value,
                        unit:
                          current.unit ||
                          item?.unit ||
                          "",
                        unitCost:
                          current.unitCost !==
                          ""
                            ? current.unitCost
                            : item?.lastPurchaseCost ??
                              item?.costPerUnit ??
                              ""
                      })
                    );
                  }}
                >
                  <option value="">
                    Select item
                  </option>
                  {inventory.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name ||
                          item.item} · Stock{" "}
                        {num(
                          item.qty ??
                            item.stock
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              <Field
                label="Return quantity"
                type="number"
                value={returnForm.qty}
                onChange={(value) =>
                  setReturnForm(
                    (current) => ({
                      ...current,
                      qty: value
                    })
                  )
                }
              />

              <Field
                label="Unit cost"
                type="number"
                value={
                  returnForm.unitCost
                }
                onChange={(value) =>
                  setReturnForm(
                    (current) => ({
                      ...current,
                      unitCost: value
                    })
                  )
                }
              />

              <Field
                label="Unit"
                value={returnForm.unit}
                onChange={(value) =>
                  setReturnForm(
                    (current) => ({
                      ...current,
                      unit: value
                    })
                  )
                }
              />

              <div className="p0-span-4">
                <Field
                  label="Return reason"
                  value={
                    returnForm.reason
                  }
                  onChange={(value) =>
                    setReturnForm(
                      (current) => ({
                        ...current,
                        reason: value
                      })
                    )
                  }
                  placeholder="Damaged / expired / wrong item"
                />
              </div>
            </div>

            <div className="p0-actions">
              <Btn
                onClick={createPurchaseReturn}
                disabled={saving}
                danger
              >
                <RotateCcw size={14} />
                {saving
                  ? "Processing…"
                  : "Create Purchase Return"}
              </Btn>
            </div>

            {returnsLoading ? (
              <Loading />
            ) : !purchaseReturns.length ? (
              <Empty text="No purchase returns found." />
            ) : (
              <div className="p0-table-wrap">
                <table className="p0-table">
                  <thead>
                    <tr>
                      <th>Return</th>
                      <th>Supplier</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Total</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseReturns.map(
                      (item) => (
                        <tr key={item.id}>
                          <td>
                            {item.returnNumber ||
                              item.id}
                          </td>
                          <td>
                            {item.supplierName ||
                              "Supplier"}
                          </td>
                          <td>
                            {item.itemName ||
                              "Item"}
                          </td>
                          <td>
                            {item.qty}{" "}
                            {item.unit}
                          </td>
                          <td>
                            {money(
                              item.total
                            )}
                          </td>
                          <td>
                            {item.reason ||
                              "—"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "supplier-payments" && (
          <>
            <div className="p0-grid-4">
              <label className="p0-field">
                <span>Supplier</span>
                <select
                  value={
                    paymentForm.supplierId
                  }
                  onChange={(event) =>
                    setPaymentForm(
                      (current) => ({
                        ...current,
                        supplierId:
                          event.target.value
                      })
                    )
                  }
                >
                  <option value="">
                    Select supplier
                  </option>
                  {activeSuppliers.map(
                    (supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <Field
                label="Payment amount"
                type="number"
                value={
                  paymentForm.amount
                }
                onChange={(value) =>
                  setPaymentForm(
                    (current) => ({
                      ...current,
                      amount: value
                    })
                  )
                }
              />

              <label className="p0-field">
                <span>Payment method</span>
                <select
                  value={
                    paymentForm.method
                  }
                  onChange={(event) =>
                    setPaymentForm(
                      (current) => ({
                        ...current,
                        method:
                          event.target.value
                      })
                    )
                  }
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>Other</option>
                </select>
              </label>

              <Field
                label="Reference"
                value={
                  paymentForm.reference
                }
                onChange={(value) =>
                  setPaymentForm(
                    (current) => ({
                      ...current,
                      reference: value
                    })
                  )
                }
                placeholder="UTR / transaction ID"
              />

              <div className="p0-span-4">
                <Field
                  label="Notes"
                  value={
                    paymentForm.notes
                  }
                  onChange={(value) =>
                    setPaymentForm(
                      (current) => ({
                        ...current,
                        notes: value
                      })
                    )
                  }
                />
              </div>
            </div>

            <div className="p0-actions">
              <Btn
                onClick={saveSupplierPayment}
                disabled={saving}
              >
                <Save size={14} />
                {saving
                  ? "Saving…"
                  : "Record Supplier Payment"}
              </Btn>
            </div>

            {supplierPaymentsLoading ? (
              <Loading />
            ) : !supplierPayments.length ? (
              <Empty text="No supplier payments recorded." />
            ) : (
              <div className="p0-table-wrap">
                <table className="p0-table">
                  <thead>
                    <tr>
                      <th>Payment</th>
                      <th>Supplier</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierPayments.map(
                      (payment) => (
                        <tr
                          key={payment.id}
                        >
                          <td>
                            {payment.paymentNumber ||
                              payment.id}
                          </td>
                          <td>
                            {payment.supplierName ||
                              "Supplier"}
                          </td>
                          <td>
                            {money(
                              payment.amount
                            )}
                          </td>
                          <td>
                            {payment.method ||
                              "Cash"}
                          </td>
                          <td>
                            {payment.reference ||
                              "—"}
                          </td>
                          <td>
                            <span className="p0-badge">
                              {payment.status ||
                                "Paid"}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}

