
import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Lock,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  X
} from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query as firestoreQuery,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import "./order.css";

const INK = "#4C1504";
const BRASS = "#FF6B4A";
const LINE = "rgba(76,21,4,0.12)";
const serif = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  letterSpacing: "-0.035em"
};

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const seedPaymentSettings = () => ({
  merchantName: "Clock Tower",
  upiId: "",
  qrImage: "",
  cashEnabled: true,
  upiEnabled: true,
  cardEnabled: true
});

function Badge({ children }) {
  return <span className="order-status-badge">{children}</span>;
}

function OrderDishCard({ d, qty, onAdd }) {
  return (
    <article className="order-dish-card">
      <div className="order-dish-image-wrap">
        {d.img ? (
          <img src={d.img} alt={d.name || "Dish"} className="order-dish-image" />
        ) : (
          <div className="order-dish-image-placeholder">{d.name || "Dish"}</div>
        )}
      </div>
      <div className="order-dish-copy">
        <span className="order-dish-category">{d.category || "SPECIAL"}</span>
        <h3>{d.name}</h3>
        <p>{d.description || "Freshly prepared in our kitchen."}</p>
        <div className="order-dish-bottom">
          <strong>{money(d.price)}</strong>
          <div className="order-qty-control">
            {qty > 0 && (
              <button type="button" onClick={() => onAdd(-1)} aria-label={`Remove ${d.name}`}>
                <Minus size={15} />
              </button>
            )}
            {qty > 0 && <span>{qty}</span>}
            <button type="button" onClick={() => onAdd(1)} aria-label={`Add ${d.name}`}>
              <Plus size={15} />
              <span>{qty > 0 ? "" : "Add"}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   ORDER PAGE
   ========================================================= */

export default function OrderPage({
  products,
  cart,
  addToCart,
  placeOrder,
  orders = [],
  currentUser,
  paymentSettings = seedPaymentSettings(),
  nav
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [section, setSection] = useState("menu");
  const [checkoutStep, setCheckoutStep] = useState("browse");
  const [orderType, setOrderType] = useState("Delivery");
  const [details, setDetails] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.mobile || "",
    address: currentUser?.address || "",
    landmark: "",
    instructions: "",
    table: "",
    tableId: ""
  });

  // Dine-in tables are controlled by Admin > Tables & Orders.
  // Only tables whose current Firestore status is Available are shown here.
  const [restaurantTables, setRestaurantTables] = useState([]);
  const [confirmedId, setConfirmedId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Pay on Delivery / Counter");
  const [upiPaymentAcknowledged, setUpiPaymentAcknowledged] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [vegOnly, setVegOnly] = useState(false);
  const [priceFilter, setPriceFilter] = useState("all");
  const [loyaltyCustomers, setLoyaltyCustomers] = useState([]);
  const [loyaltyPointsInput, setLoyaltyPointsInput] = useState("");
  const [loyaltyPointValue, setLoyaltyPointValue] = useState(1);

  useEffect(() => {
    try {
      const requestedStep = sessionStorage.getItem("kaveri-open-checkout");
      if (requestedStep) {
        setCheckoutStep(requestedStep);
        sessionStorage.removeItem("kaveri-open-checkout");
      }
    } catch {}
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "settings", "loyalty"),
      (snapshot) => {
        if (snapshot.exists()) {
          setLoyaltyPointValue(Math.max(0.01, Number(snapshot.data().pointValue ?? 1)));
        }
      },
      (error) => console.error("Firestore loyalty settings listener error:", error)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "loyalty"),
      (snapshot) => {
        setLoyaltyCustomers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      },
      (error) => {
        console.error("Firestore loyalty listener error:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tables"),
      (snapshot) => {
        const rows = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((table) => String(table.status || "Available") === "Available")
          .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), undefined, { numeric: true }));

        setRestaurantTables(rows);

        // If the selected table becomes occupied/reserved/cleaning elsewhere,
        // remove it from the customer's selection immediately.
        setDetails((current) => {
          if (!current.tableId) return current;
          const stillAvailable = rows.some((table) => String(table.id) === String(current.tableId));
          return stillAvailable ? current : { ...current, table: "", tableId: "" };
        });
      },
      (error) => {
        console.error("Firestore tables listener error:", error);
        setRestaurantTables([]);
      }
    );

    return () => unsubscribe();
  }, []);

  const orderCategories = [
    "All",
    ...Array.from(
      new Set(
        products
          .filter((p) => p.available !== false)
          .map((p) => String(p.category || "").trim())
          .filter(Boolean)
      )
    )
  ];

  const list = products
    .filter(
      (p) =>
        p.available !== false &&
        (cat === "All" || p.category === cat) &&
        p.name.toLowerCase().includes(query.toLowerCase()) &&
        (!vegOnly || p.veg === true || String(p.type || "").toLowerCase() === "veg") &&
        (
          priceFilter === "all" ||
          (priceFilter === "under250" && Number(p.price) < 250) ||
          (priceFilter === "250to500" && Number(p.price) >= 250 && Number(p.price) <= 500) ||
          (priceFilter === "over500" && Number(p.price) > 500)
        )
    )
    .sort((a, b) => {
      if (sortBy === "priceLow") return Number(a.price) - Number(b.price);
      if (sortBy === "priceHigh") return Number(b.price) - Number(a.price);
      if (sortBy === "name") return String(a.name).localeCompare(String(b.name));
      if (sortBy === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
      return 0;
    });

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find((p) => p.id === id);
      return product ? { ...product, qty } : null;
    })
    .filter(Boolean);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const deliveryFee =
    orderType === "Delivery" && subtotal > 0
      ? subtotal >= 500 ? 0 : 40
      : 0;

  const loyaltyPhone = String(details.phone || currentUser?.mobile || "").replace(/\D/g, "");
  const loyaltyCustomer = loyaltyCustomers.find(
    (customer) => String(customer.phone || "").replace(/\D/g, "") === loyaltyPhone
  );
  const availableLoyaltyPoints = Math.max(0, Number(loyaltyCustomer?.availablePoints ?? loyaltyCustomer?.points ?? 0));
  const maxRedeemablePoints = Math.min(availableLoyaltyPoints, Math.floor(Math.max(0, subtotal) / loyaltyPointValue));
  const requestedLoyaltyPoints = Math.max(0, Math.floor(Number(loyaltyPointsInput) || 0));
  const loyaltyPointsUsed = Math.min(requestedLoyaltyPoints, maxRedeemablePoints);
  const loyaltyDiscount = loyaltyPointsUsed * loyaltyPointValue;
  const total = Math.max(0, subtotal + deliveryFee - loyaltyDiscount);

  const sortedOrders = orders.filter((order) => {
    if (!currentUser) return false;

    const userId = String(currentUser.id || "");
    const userMobile = String(currentUser.mobile || "").replace(/\D/g, "");
    const orderCustomerId = String(order.customerId || order.customer?.id || "");
    const orderPhone = String(order.phone || order.customer?.mobile || "").replace(/\D/g, "");

    return (userId && orderCustomerId === userId) ||
      (userMobile && orderPhone === userMobile);
  }).sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const bTime = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
    return bTime - aTime;
  });

  const activeOrders = sortedOrders.filter(
    (order) => !["Delivered", "Cancelled"].includes(order.status)
  );

  const selectedOrder =
    sortedOrders.find((order) => String(order.id) === String(selectedOrderId)) ||
    activeOrders[0] ||
    sortedOrders[0] ||
    null;

  const statusFlow = [
    "New",
    "Accepted",
    "Preparing",
    "Ready",
    "Out for Delivery",
    "Delivered"
  ];

  const statusIndex = (status) =>
    statusFlow.indexOf(status);

  const submitOrder = async (forceUpiPaid = false) => {
    if (!cartItems.length) return;

    if (orderType === "Dine-in") {
      if (!details.tableId) {
        alert("Please select an available table before placing the dine-in order.");
        return;
      }

      const selectedTable = restaurantTables.find(
        (table) => String(table.id) === String(details.tableId)
      );

      if (!selectedTable || String(selectedTable.status || "Available") !== "Available") {
        alert("This table is no longer available. Please select another table.");
        setDetails((current) => ({ ...current, table: "", tableId: "" }));
        return;
      }
    }

    const upiPaid = paymentMethod === "UPI" && (upiPaymentAcknowledged || forceUpiPaid);
    if (paymentMethod === "UPI" && !upiPaid) {
      alert("Please complete the UPI payment and tap 'I have completed the UPI payment' before placing the order.");
      return;
    }

    const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const savedId = await placeOrder({
        id,
        type: orderType,
        customer:
          orderType === "Dine-in"
            ? `Table ${details.table || "-"}`
            : details.name || "Guest",
        phone: details.phone,
        address: details.address,
        landmark: details.landmark,
        instructions: details.instructions,
        table: orderType === "Dine-in" ? details.tableId : "",
        tableId: orderType === "Dine-in" ? details.tableId : "",
        tableNumber: orderType === "Dine-in" ? details.table : "",
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          points: Number(item.points || item.loyaltyPoints || 0),
          img: item.img
        })),
        subtotal,
        deliveryFee,
        loyaltyPointsUsed,
        loyaltyDiscount,
        total,
        paymentMethod,
        paymentStatus: upiPaid ? "Paid" : "Pending",
        paymentConfirmed: upiPaid,
        paymentConfirmedAt: upiPaid ? new Date().toISOString() : null,
        status: "New",
        source: "Website",
        channel: "website",
        orderNumber: id,
        branchId: "branch-01",
        time: "just now"
      });

      if (orderType === "Dine-in" && details.tableId) {
        try {
          await updateDoc(doc(db, "tables", details.tableId), {
            status: "Occupied",
            orderId: savedId,
            customerId: currentUser?.id || null,
            occupiedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (tableError) {
          console.error("Dine-in table status update failed:", tableError);
          alert("Order was placed, but the table status could not be updated. Please refresh the page.");
        }
      }

      setConfirmedId(savedId);
      setSelectedOrderId(savedId);
      setLoyaltyPointsInput("");
      setCheckoutStep("confirmed");
      setSection("orders");
    } catch (error) {
      console.error("Order save failed:", error);
      alert(error?.message || "Unable to place order. Please try again.");
    }
  };

  const openOrders = () => {
    setSection("orders");
    setCheckoutStep("browse");
    const latest = activeOrders[0] || sortedOrders[0] || null;
    setSelectedOrderId(latest?.id || confirmedId || null);
  };

  const cancelOrder = async (order) => {
    if (!order?.id) return;

    if (order.status !== "New") {
      alert("This order can only be cancelled while it is New.");
      return;
    }

    const confirmed = window.confirm(`Cancel order ${order.id}?`);
    if (!confirmed) return;

    try {
      /*
       * The customer-facing order number (for example ORD-7370) is not
       * always the Firestore document ID. Older orders may have an
       * auto-generated Firestore document ID.
       *
       * First try the visible ID as the document ID. If that document
       * does not exist, find the actual Firestore document using
       * orderNumber, then fall back to the stored id field.
       */
      let orderDocRef = doc(db, "orders", String(order.id));
      let orderSnapshot = await getDoc(orderDocRef);

      if (!orderSnapshot.exists()) {
        const orderNumber = String(order.orderNumber || order.id || "").trim();

        if (!orderNumber) {
          throw new Error("Order document could not be identified.");
        }

        const orderQuery = firestoreQuery(
          collection(db, "orders"),
          where("orderNumber", "==", orderNumber)
        );

        const orderQuerySnapshot = await getDocs(orderQuery);

        if (orderQuerySnapshot.empty) {
          // Final fallback for older orders that may not have orderNumber.
          const allOrdersSnapshot = await getDocs(collection(db, "orders"));
          const matchingDoc = allOrdersSnapshot.docs.find((item) => {
            const data = item.data() || {};
            return (
              String(data.orderNumber || "") === orderNumber ||
              String(data.id || "") === orderNumber
            );
          });

          if (!matchingDoc) {
            throw new Error(`No Firestore document found for order ${orderNumber}.`);
          }

          orderDocRef = matchingDoc.ref;
        } else {
          orderDocRef = orderQuerySnapshot.docs[0].ref;
        }
      }

      await updateDoc(orderDocRef, {
        status: "Cancelled",
        cancelledBy: "customer",
        cancelledAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        customerPhone: String(order.phone || "").replace(/\D/g, "")
      });

      if (order.type === "Dine-in" && (order.tableId || order.table)) {
        const tableId = order.tableId || order.table;

        try {
          await updateDoc(doc(db, "tables", tableId), {
            status: "Available",
            orderId: null,
            customerId: null,
            occupiedAt: null,
            updatedAt: serverTimestamp()
          });
        } catch (tableError) {
          console.error("Dine-in table release failed:", tableError);
        }
      }

      setSelectedOrderId(order.id);
    } catch (error) {
      console.error("Order cancellation failed:", error);
      alert(error?.message || "Unable to cancel this order.");
    }
  };

  if (checkoutStep === "confirmed") {
    return (
      <div className="order-page">
        <div className="order-content">
        <div className="order-top-navigation">
          <button type="button" className="order-home-button" onClick={() => {
            if (typeof nav === "function") nav("landing");
            else window.location.href = "/main";
          }}>
            <ChevronLeft size={16} />
            <span>Back to Home</span>
          </button>
          <div className="order-top-links">
            <button type="button" onClick={() => nav?.("landing")}>Home</button>
            <button type="button" onClick={() => nav?.("order")}>Menu / Order</button>
            <button type="button" onClick={openOrders}>My Orders</button>
          </div>
        </div>
          <div
            style={{
              minHeight: "72vh",
              display: "grid",
              placeItems: "center",
              padding: "55px 20px"
            }}
          >
            <div
              style={{
                width: "min(620px,100%)",
                padding: 35,
                background: "#fff",
                borderRadius: 24,
                textAlign: "center",
                border: "1px solid rgba(76,21,4,0.08)",
                boxShadow: "0 18px 55px rgba(76,21,4,0.08)"
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  margin: "0 auto 16px",
                  borderRadius: "50%",
                  background: "#e8f2e5",
                  color: "#4f8a5d",
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Check size={31} />
              </div>

              <h2
                style={{
                  ...serif,
                  margin: 0,
                  color: INK,
                  fontSize: 36
                }}
              >
                Order Confirmed
              </h2>

              <p style={{ color: "#806b63", fontSize: 13 }}>
                Order <strong>{confirmedId}</strong> has been placed successfully.
              </p>
              {paymentMethod === "UPI" && (
                <div className="payment-confirmation-success">
                  <span>✓</span>
                  <div><strong>UPI payment confirmed</strong><small>Your order is now confirmed and sent to the restaurant.</small></div>
                </div>
              )}

              <p style={{ color: "#806b63", fontSize: 13, marginBottom: 22 }}>
                Total: <strong>{money(total)}</strong> · {orderType}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10
                }}
              >
                <button
                  className="btn-primary"
                  onClick={() => {
                    setCheckoutStep("browse");
                    setSection("orders");
                    setSelectedOrderId(confirmedId);
                  }}
                >
                  Track My Order
                </button>

                <button
                  onClick={() => {
                    setCheckoutStep("browse");
                    setSection("menu");
                  }}
                  style={{
                    minHeight: 46,
                    border: "1px solid rgba(76,21,4,0.12)",
                    borderRadius: 999,
                    background: "#fff",
                    color: INK,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Order More Food
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page">
      <div className="order-content">
        <div
          className="order-page-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 20
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: BRASS,
                background: "rgba(255,107,74,0.08)",
                borderRadius: 999,
                padding: "7px 11px",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 10
              }}
            >
              <ClipboardList size={13} /> Restaurant Orders
            </div>

            <h1>{section === "orders" ? "My Orders" : "Order Food"}</h1>

            <p>
              {section === "orders"
                ? "Track your current orders and view your order history."
                : "Choose your favourites and order fresh from our kitchen."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSection("menu");
                setCheckoutStep("browse");
              }}
              className={`order-section-button ${section === "menu" ? "active" : ""}`}
            >
              Order Food
            </button>

            {section !== "orders" && (
              <button
                type="button"
                onClick={openOrders}
                className="order-section-button"
              >
                <ClipboardList size={14} />
                My Orders
                {activeOrders.length > 0 && (
                  <span className="order-count-badge">
                    {activeOrders.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {section === "orders" ? (
          <div className="my-orders-layout">
            <div className="my-orders-list">
              <div className="my-orders-list-header">
                <h2>Your Orders</h2>
                <span>{sortedOrders.length}</span>
              </div>

              {sortedOrders.length === 0 ? (
                <div className="orders-empty">
                  <ClipboardList size={30} />
                  <h3>No orders yet</h3>
                  <p>Your orders will appear here after checkout.</p>
                  <button
                    className="btn-primary"
                    onClick={() => setSection("menu")}
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                sortedOrders.map((order) => (
                  <button
                    type="button"
                    key={order.id}
                    className={`order-history-card ${
                      selectedOrder?.id === order.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="order-history-top">
                      <strong>{order.id}</strong>
                      <Badge
                        tone={
                          order.status === "Delivered"
                            ? "green"
                            : order.status === "Cancelled"
                              ? "red"
                              : "brass"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>

                    <div className="order-history-items">
                      {(order.items || []).slice(0, 2).map((item, index) => (
                        <span key={index}>
                          {item.qty}× {item.name}
                          {index < Math.min(order.items?.length || 0, 2) - 1 ? ", " : ""}
                        </span>
                      ))}
                      {(order.items?.length || 0) > 2 && (
                        <span> +{order.items.length - 2} more</span>
                      )}
                    </div>

                    <div className="order-history-bottom">
                      <span>{order.type}</span>
                      <span className="order-history-actions">
                        <strong>{money(order.total)}</strong>
                        {order.status === "New" && (
                          <button
                            type="button"
                            className="order-history-cancel"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              cancelOrder(order);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {selectedOrder && (
              <div className="order-tracking-card">
                <div className="order-detail-header">
                  <div>
                    <span>ORDER DETAILS</span>
                    <h2>{selectedOrder.id}</h2>
                    <p>
                      {selectedOrder.time} · {selectedOrder.type}
                    </p>
                  </div>

                  <div className="order-detail-actions">
                    <Badge
                      tone={
                        selectedOrder.status === "Delivered"
                          ? "green"
                          : selectedOrder.status === "Cancelled"
                            ? "red"
                            : "brass"
                      }
                    >
                      {selectedOrder.status}
                    </Badge>
                    {selectedOrder.status === "New" && (
                      <button
                        type="button"
                        className="order-cancel-button"
                        onClick={() => cancelOrder(selectedOrder)}
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                {selectedOrder.status === "Cancelled" ? (
                  <div className="cancelled-order-message">
                    <X size={19} />
                    This order was cancelled.
                  </div>
                ) : (
                  <div className="order-status-box">
                    <div className="order-status-title">Order Status</div>

                    <div className="status-track">
                      <div className="status-track-line" />

                      {statusFlow.map((status, index) => {
                        const current = statusIndex(selectedOrder.status);
                        const done = index <= current;

                        return (
                          <div className="status-step" key={status}>
                            <div className={`status-dot ${done ? "done" : ""}`}>
                              {done ? <Check size={14} /> : null}
                            </div>
                            <span>{status}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="current-status-row">
                      <span>Current Status</span>
                      <strong>{selectedOrder.status}</strong>
                    </div>
                  </div>
                )}

                <div className="ordered-items-title">
                  Items Ordered
                </div>

                <div className="ordered-items-list">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div className="ordered-item" key={index}>
                      <div>
                        <strong>
                          {item.qty} × {item.name}
                        </strong>
                        {item.price && (
                          <span>{money(item.price)} each</span>
                        )}
                      </div>

                      {item.price && (
                        <strong>
                          {money(item.price * item.qty)}
                        </strong>
                      )}
                    </div>
                  ))}
                </div>

                <div className="order-info-grid">
                  <div>
                    <span>Customer</span>
                    <strong>{selectedOrder.customer}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{money(selectedOrder.total)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : checkoutStep === "browse" ? (
          <div className="order-layout">
            <div>
              <div className="menu-search-row">
                <div className="menu-search-box">
                  <Search size={17} color="#9a8780" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search dishes..."
                  />
                  {query && (
                    <button
                      type="button"
                      className="menu-search-clear"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className={`menu-filter-button${filterOpen ? " active" : ""}`}
                  onClick={() => setFilterOpen((open) => !open)}
                >
                  <SlidersHorizontal size={16} />
                  Filter
                  {(sortBy !== "default" || vegOnly || priceFilter !== "all") && (
                    <span className="menu-filter-count">•</span>
                  )}
                </button>
              </div>

              {filterOpen && (
                <div className="menu-filter-panel">
                  <div className="menu-filter-field">
                    <label>Sort by</label>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                      <option value="default">Recommended</option>
                      <option value="rating">Top rated</option>
                      <option value="priceLow">Price: Low to High</option>
                      <option value="priceHigh">Price: High to Low</option>
                      <option value="name">Name: A–Z</option>
                    </select>
                  </div>

                  <div className="menu-filter-field">
                    <label>Price</label>
                    <select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
                      <option value="all">Any price</option>
                      <option value="under250">Under ₹250</option>
                      <option value="250to500">₹250–₹500</option>
                      <option value="over500">Above ₹500</option>
                    </select>
                  </div>

                  <label className="menu-filter-check">
                    <input
                      type="checkbox"
                      checked={vegOnly}
                      onChange={(event) => setVegOnly(event.target.checked)}
                    />
                    <span>Vegetarian only</span>
                  </label>

                  <button
                    type="button"
                    className="menu-filter-reset"
                    onClick={() => {
                      setSortBy("default");
                      setPriceFilter("all");
                      setVegOnly(false);
                    }}
                  >
                    Reset
                  </button>
                </div>
              )}

              <div className="order-category-row">
                {orderCategories.map((category) => (
                  <button
                    key={category}
                    className={`category-pill ${cat === category ? "active" : ""}`}
                    onClick={() => setCat(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="bestseller-grid">
                {list.map((dish) => (
                  <OrderDishCard
                    key={dish.id}
                    d={dish}
                    qty={cart[dish.id] || 0}
                    onAdd={(delta) => addToCart(dish.id, delta)}
                  />
                ))}
              </div>

              {list.length === 0 && (
                <div className="empty-state">
                  No dishes match your search.
                </div>
              )}
            </div>

            <div className="cart-card">
              <div className="cart-header-row">
                <h3>Your Cart</h3>
                {cartItems.length > 0 && (
                  <button onClick={openOrders}>
                    My Orders
                  </button>
                )}
              </div>

              {cartItems.length === 0 && (
                <div className="cart-empty-message">
                  Add dishes to get started.
                </div>
              )}

              {cartItems.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-image">
                    <img src={item.img} alt={item.name} />
                  </div>

                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p>{money(item.price * item.qty)}</p>
                  </div>

                  <div className="qty-controls">
                    <button onClick={() => addToCart(item.id, -1)}>
                      <Minus size={13} />
                    </button>
                    <strong>{item.qty}</strong>
                    <button onClick={() => addToCart(item.id, 1)}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {cartItems.length > 0 && (
                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                  </div>

                  <div className="summary-row">
                    <span>Delivery</span>
                    <strong>
                      {deliveryFee === 0 ? "FREE" : money(deliveryFee)}
                    </strong>
                  </div>

                  <div className="summary-row total">
                    <span>Total</span>
                    <strong>{money(total)}</strong>
                  </div>

                  <button
                    className="btn-primary"
                    style={{ width: "100%", marginTop: 15 }}
                    onClick={() => setCheckoutStep("type")}
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : checkoutStep === "type" ? (
          <CheckoutBox
            title="Choose order type"
            onBack={() => setCheckoutStep("browse")}
          >
            {["Delivery", "Takeaway", "Dine-in"].map((type) => (
              <button
                type="button"
                key={type}
                className={`checkout-option ${orderType === type ? "active" : ""}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setOrderType(type);
                }}
              >
                {type}
              </button>
            ))}

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 10 }}
              onClick={() => setCheckoutStep("details")}
            >
              Continue
            </button>
          </CheckoutBox>
        ) : checkoutStep === "details" ? (
          <CheckoutBox
            title="Your details"
            onBack={() => setCheckoutStep("type")}
          >
            {orderType === "Dine-in" ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: INK, fontSize: 12, fontWeight: 750, marginBottom: 8 }}>
                  Select available table
                </div>

                {restaurantTables.length === 0 ? (
                  <div
                    style={{
                      padding: "14px 12px",
                      border: "1px solid rgba(76,21,4,0.12)",
                      borderRadius: 10,
                      background: "#fffaf7",
                      color: "#8a7770",
                      fontSize: 12
                    }}
                  >
                    No tables are currently available. Please try again in a moment.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                      gap: 10
                    }}
                  >
                    {restaurantTables.map((table) => {
                      const selected = String(details.tableId) === String(table.id);
                      return (
                        <button
                          key={table.id}
                          type="button"
                          onClick={() =>
                            setDetails((current) => ({
                              ...current,
                              tableId: table.id,
                              table: table.name || table.id
                            }))
                          }
                          style={{
                            minHeight: 72,
                            padding: "12px 10px",
                            borderRadius: 12,
                            border: selected
                              ? "2px solid #FF6B4A"
                              : "1px solid rgba(76,21,4,0.12)",
                            background: selected ? "#fff0eb" : "#fff",
                            color: INK,
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                        >
                          <strong style={{ display: "block", fontSize: 15 }}>
                            {table.name || table.id}
                          </strong>
                          <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "#4F8A5D" }}>
                            Available · {table.capacity || table.seats || 0} seats
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {details.tableId && (
                  <div style={{ marginTop: 9, fontSize: 12, color: "#4F8A5D", fontWeight: 750 }}>
                    Selected table: {details.table || details.tableId}
                  </div>
                )}
              </div>
            ) : (
              <>
                <Field
                  label="Name"
                  value={details.name}
                  onChange={(value) =>
                    setDetails({ ...details, name: value })
                  }
                />
                <Field
                  label="Phone"
                  value={details.phone}
                  onChange={(value) =>
                    setDetails({ ...details, phone: value })
                  }
                />
                {orderType === "Delivery" && (
                  <>
                    <Field
                      label="Address"
                      value={details.address}
                      onChange={(value) =>
                        setDetails({ ...details, address: value })
                      }
                    />
                    <Field
                      label="Landmark"
                      value={details.landmark}
                      onChange={(value) =>
                        setDetails({ ...details, landmark: value })
                      }
                    />
                    <Field
                      label="Delivery instructions"
                      value={details.instructions}
                      onChange={(value) =>
                        setDetails({ ...details, instructions: value })
                      }
                    />
                  </>
                )}
              </>
            )}

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 10 }}
              onClick={() => setCheckoutStep("payment")}
            >
              Continue to Payment
            </button>
          </CheckoutBox>
        ) : (
          <CheckoutBox
            title="Payment"
            onBack={() => setCheckoutStep("details")}
          >
            <div className="payment-hero-card">
              <div className="payment-hero-icon">₹</div>
              <div>
                <span>AMOUNT PAYABLE</span>
                <strong>{money(total)}</strong>
                <small>Secure checkout · No hidden charges</small>
              </div>
            </div>

            <div className="payment-section-label">Choose payment method</div>

            <div className="payment-methods">
              {[
                {
                  id: "Pay on Delivery / Counter",
                  title: "Pay at Delivery / Counter",
                  subtitle: "Cash or UPI when you receive your order",
                  icon: "💵",
                  badge: "Recommended"
                },
                {
                  id: "UPI",
                  title: "UPI",
                  subtitle: `Google Pay, PhonePe, Paytm and more · ${paymentSettings.upiId || ""}`,
                  icon: "◉"
                },
                {
                  id: "Card",
                  title: "Credit / Debit Card",
                  subtitle: "Visa, Mastercard and other cards",
                  icon: "▣"
                }
              ].filter((method) => (method.id === "UPI" ? paymentSettings.upiEnabled : method.id === "Card" ? paymentSettings.cardEnabled : paymentSettings.cashEnabled)).map((method) => (
                <button
                  type="button"
                  className={`payment-method-card ${paymentMethod === method.id ? "active" : ""}`}
                  key={method.id}
                  onClick={() => {
                    setPaymentMethod(method.id);
                    setUpiPaymentAcknowledged(false);
                  }}
                >
                  <span className="payment-method-icon">{method.icon}</span>

                  <span className="payment-method-copy">
                    <strong>{method.title}</strong>
                    <small>{method.subtitle}</small>
                  </span>

                  {method.badge && (
                    <span className="payment-method-badge">{method.badge}</span>
                  )}

                  <span className="payment-radio">
                    {paymentMethod === method.id ? <Check size={13} /> : null}
                  </span>
                </button>
              ))}
            </div>

            {paymentMethod === "UPI" && (
              <div className="admin-upi-checkout-card">
                <div className="admin-upi-checkout-head">
                  <div>
                    <strong>Scan to Pay</strong>
                    <span>{paymentSettings.merchantName || "Restaurant"}</span>
                  </div>
                  <span className="admin-upi-id">{paymentSettings.upiId}</span>
                </div>
                {paymentSettings.qrImage ? (
                  <img src={paymentSettings.qrImage} alt="UPI payment QR" className="admin-upi-checkout-qr" />
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(`upi://pay?pa=${paymentSettings.upiId || ""}&pn=${paymentSettings.merchantName || "Restaurant"}&am=${Number(total || 0).toFixed(2)}&cu=INR`)}`}
                    alt="Generated UPI payment QR"
                    className="admin-upi-checkout-qr generated-upi-qr"
                  />
                )}
                <a
                  className="upi-open-app-button"
                  href={`upi://pay?pa=${encodeURIComponent(paymentSettings.upiId || "")}&pn=${encodeURIComponent(paymentSettings.merchantName || "Restaurant")}&am=${Number(total || 0).toFixed(2)}&cu=INR`}
                >
                  Open UPI App · {money(total)}
                </a>
                <p>Scan the QR or open your UPI app, complete the payment, then tap the confirmation button below. </p>
                <button
                  type="button"
                  className={`upi-payment-done-button ${upiPaymentAcknowledged ? "confirmed" : ""}`}
                  onClick={async () => {
                    setUpiPaymentAcknowledged(true);
                    await submitOrder(true);
                  }}
                >
                  {upiPaymentAcknowledged ? "✓ Payment confirmed · Order processing" : "I have completed the UPI payment"}
                </button>
                <small className="upi-verification-note">This is a customer confirmation step; live bank/payment-gateway verification requires a payment gateway integration.</small>
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                padding: 16,
                border: "1px solid rgba(76,21,4,0.12)",
                borderRadius: 14,
                background: "#fffaf7"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <strong style={{ display: "block", color: "#4c1504" }}>Loyalty Rewards</strong>
                  <small style={{ color: "#8a7770" }}>Available: {availableLoyaltyPoints} points · 1 point = ₹{loyaltyPointValue}</small>
                </div>
                {availableLoyaltyPoints > 0 && <span style={{ color: "#4c1504", fontWeight: 750 }}>{availableLoyaltyPoints} pts</span>}
              </div>

              {availableLoyaltyPoints > 0 ? (
                <>
                  <label style={{ display: "block", marginTop: 12, fontSize: 12, fontWeight: 750, color: "#4c1504" }}>
                    Points to use
                    <input
                      type="number"
                      min="0"
                      max={maxRedeemablePoints}
                      step="1"
                      value={loyaltyPointsInput}
                      onChange={(event) => setLoyaltyPointsInput(event.target.value)}
                      placeholder={`Max ${maxRedeemablePoints}`}
                      style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 6, padding: "10px 12px", border: "1px solid rgba(76,21,4,0.14)", borderRadius: 9, background: "#fff", color: "#4c1504" }}
                    />
                  </label>
                  {loyaltyPointsUsed > 0 && (
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", color: "#4c1504" }}>
                      <span>Loyalty discount</span><strong>-{money(loyaltyDiscount)}</strong>
                    </div>
                  )}
                  {maxRedeemablePoints === 0 && <small style={{ display: "block", marginTop: 7, color: "#8a7770" }}>No points can be used on this order.</small>}
                </>
              ) : (
                <small style={{ display: "block", marginTop: 8, color: "#8a7770" }}>Enter the same phone number used for your loyalty account to use points.</small>
              )}
            </div>

            <div className="payment-security-note">
              <Lock size={14} />
              <span>Your payment details are handled securely.</span>
            </div>

            <button
              className="payment-place-order-btn"
              onClick={submitOrder}
            >
              <span>Place Order</span>
              <strong>{money(total)}</strong>
              <ChevronRight size={17} />
            </button>
          </CheckoutBox>
        )}
      </div>
      {Object.values(cart).some((qty) => Number(qty) > 0) && (
        <button
          type="button"
          className="mobile-floating-cart-button"
          onClick={() => nav("cart")}
          aria-label="Open cart"
        >
          <span><ShoppingCart size={17} /> View Cart</span>
          <strong>{cartItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)} items</strong>
          <ChevronRight size={17} />
        </button>
      )}
    </div>
  );
}


function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label
      style={{
        display: "block",
        color: INK,
        fontSize: 12,
        fontWeight: 750,
        marginBottom: 12
      }}
    >
      {label}
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          marginTop: 6,
          minHeight: 44,
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          background: "#fffaf7",
          color: INK,
          padding: "10px 12px",
          outline: "none"
        }}
      />
    </label>
  );
}

function CheckoutBox({ title, onBack, children }) {
  return (
    <div className="checkout-box">
      <button type="button" className="checkout-back" onClick={onBack}>
        <ChevronLeft size={14} /> Back
      </button>
      <h2>{title}</h2>
      {children}
    </div>
  );
}


