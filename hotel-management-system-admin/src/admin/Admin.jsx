import React, { useEffect, useMemo, useState } from "react";
import "./Admin.css";
import { auth, db } from "../firebase";
import RoomManagement from "./rooms/RoomManagement";
import {
  AdminPOS, AdminKitchen, AdminTaxSettings, AdminTransactions, AdminInvoices,
  AdminReports, AdminAuditLogs, AdminBranches, AdminStaffPermissions, AdminRecipes, AdminPurchasing,
  BranchSelector, canAccessSection
} from "./P0Modules";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, serverTimestamp, onSnapshot } from "firebase/firestore";
import {
  LayoutDashboard,
  BedDouble,
  Package,
  Tag,
  Users,
  Warehouse,
  LayoutGrid,
  ClipboardList,
  UserCircle2,
  Settings as SettingsIcon,
  ChevronLeft,
  Check,
  AlertTriangle,
  Trash2,
  Pencil,
  LogOut,
  Download,
  Bell,
  Flame,
  Sparkles,
  Image as ImageIcon,
  Type,
  CreditCard,
  Truck,
  MessageSquare,
  Save,
  Eye,
  ChefHat,
  CircleDollarSign,
  ReceiptText,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Phone,
  BarChart3,
  ShieldCheck,
  GitBranch,
  Receipt,
  Menu,
  CalendarDays,
  UsersRound,
  Clock3,
  LogIn,} from "lucide-react";

const INK = "#4C1504";
const BONE = "#FFF4EE";
const BRASS = "#FF6B4A";
const BRASS_SOFT = "#FF9A7A";
const LINE = "rgba(76,21,4,0.12)";

// Local calendar-safe YYYY-MM-DD key used by the Reservations module.
const dateKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

const serif = {
  fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', serif"
};

const categoryEmoji = (category) => {
  const icons = {
    Momo: "🥟",
    Chicken: "🍗",
    Biryani: "🍛",
    Chinese: "🥢",
    Indian: "🍛",
    Drinks: "🥤",
    Desserts: "🍰",
    Italian: "🍝"
  };
  return icons[category] || "🍽️";
};

const CATEGORIES = [
  "All",
  "Momo",
  "Chicken",
  "Biryani",
  "Chinese",
  "Indian",
  "Drinks",
  "Desserts",
  "Italian"
];

const seedSiteContent = () => ({
  heroEyebrow: "FRESH · HANDCRAFTED · DELICIOUS",
  heroTitle: "Savor the Taste of\nPerfection.",
  heroText: "Fresh ingredients, mouth-watering recipes and a passion for good food — freshly prepared at our kitchen.",
  restaurantNameBackgroundImage: "",
  heroMainImage: "",
  heroLeftImage: "",
  heroRightImage: "",
  offerEyebrow: "SPECIAL EDITION",
  offerSideLabel: "DAILY SPECIAL",
  offerFloatingLabel: "HANDCRAFTED",
  offerFloatingText: "Made fresh.\nServed warm.",
  offerMetaText: "FRESH / LOCAL / BOLD",
  signatureTitle: "Our Signature Dishes",
  signatureText: "Classic favourites and modern creations prepared fresh for every order.",
  aboutEyebrow: "MADE WITH LOVE",
  aboutTitle: "Good food.\nGood mood.",
  aboutText: "Carefully selected ingredients, balanced flavours and a kitchen that cares about every plate.",
  aboutImage: "",
  reviewsTitle: "They Love Us",
  reviewsText: "Good food, warm service and plenty of reasons to come back.",
  arKicker: "NEXT IN DINING",
  arTitle: "See your food\nbefore it arrives.",
  arText: "We are preparing an augmented-reality menu so you can preview selected dishes on your own table before ordering.",
  arTags: "3D Food Preview,Table View,Coming Soon",
  finalEyebrow: "KAVERI KITCHEN",
  finalTitle: "Don't Wait —\nOrder Now!",
  finalText: "Freshly prepared favourites delivered straight to your door.",
  footerTagline: "Fresh food, warm service and flavours worth coming back for.",
  footerHours: "11:00 AM – 11:00 PM",
  footerDays: "Open Every Day"
});

const seedPaymentSettings = () => ({
  upiEnabled: true,
  upiId: "kaverikitchen@upi",
  merchantName: "Kaveri Kitchen",
  qrImage: "",
  cashEnabled: true,
  cardEnabled: true
});

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const orderText = (value, fallback = "—") => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => orderText(item, ""))
      .filter(Boolean);
    return parts.length ? parts.join(", ") : fallback;
  }

  if (typeof value === "object") {
    const preferred =
      value.name ??
      value.fullName ??
      value.customerName ??
      value.label ??
      value.title ??
      value.value ??
      value.phone ??
      value.mobile ??
      value.email ??
      value.address ??
      value.id;

    if (preferred !== undefined && preferred !== null && preferred !== "") {
      return orderText(preferred, fallback);
    }

    const indexedKeys = Object.keys(value)
      .filter((key) => /^\d+$/.test(key))
      .sort((a, b) => Number(a) - Number(b));

    if (indexedKeys.length) {
      const parts = indexedKeys
        .map((key) => orderText(value[key], ""))
        .filter(Boolean);
      if (parts.length) return parts.join(" ");
    }

    return fallback;
  }

  return String(value);
};

const restaurantInitial = (name) => {
  const clean = String(name || "").trim();
  return clean ? clean.charAt(0).toUpperCase() : "K";
};

function Badge({ children, tone = "brass" }) {
  const tones = {
    brass: { bg: "rgba(255,107,74,0.12)", color: BRASS },
    green: { bg: "rgba(90,168,110,0.15)", color: "#4F8A5D" },
    red: { bg: "rgba(214,90,90,0.12)", color: "#C84632" },
    grey: { bg: "rgba(76,21,4,0.07)", color: "#75635B" }
  };
  const t = tones[tone] || tones.grey;
  return (
    <span style={{ background: t.bg, color: t.color, fontSize: 11, padding: "4px 9px", borderRadius: 999, letterSpacing: 0.2, fontWeight: 700 }}>
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    Available: "green", Occupied: "red", Cleaning: "grey", New: "brass", Accepted: "brass", Preparing: "brass", Ready: "green",
    "Out for Delivery": "brass", Delivered: "green", Cancelled: "red", "In Stock": "green", "Low Stock": "brass", "Out of Stock": "red"
  };
  return <Badge tone={map[status] || "grey"}>{status}</Badge>;
}

/* =========================================================
   ADMIN LOGIN — FIREBASE AUTHENTICATION
   ========================================================= */

function AdminLogin({ onLogin, nav }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your admin email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = result.user;
      let staffProfile = null;
      try {
        const staffSnapshot = await getDocs(query(collection(db, "staff"), where("email", "==", user.email || cleanEmail)));
        if (!staffSnapshot.empty) {
          const first = staffSnapshot.docs[0];
          staffProfile = { id: first.id, ...first.data() };
        }
      } catch (profileError) {
        console.warn("Staff profile lookup skipped:", profileError);
      }

      const account = {
        id: user.uid,
        uid: user.uid,
        name: staffProfile?.name || user.displayName || "Clock Tower Admin",
        email: user.email || cleanEmail,
        role: staffProfile?.role || "Super Admin",
        permissions: staffProfile?.permissions || [],
        branchId: staffProfile?.branchId || "all",
        phone: staffProfile?.phone || "",
        active: staffProfile?.active !== false,
      };

      if (account.active === false) {
        await signOut(auth);
        throw new Error("This staff account is disabled.");
      }

      try {
        localStorage.setItem("kaveri-current-staff", JSON.stringify(account));
      } catch {}

      onLogin(account);
    } catch (firebaseError) {
      console.error("Firebase login error:", firebaseError);

      const code = firebaseError?.code || "";

      if (
        code === "auth/invalid-credential" ||
        code === "auth/invalid-login-credentials"
      ) {
        setError("Invalid email or password.");
      } else if (code === "auth/user-not-found") {
        setError("No admin account found with this email.");
      } else if (code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many login attempts. Please try again later.");
      } else if (code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(firebaseError?.message || "Unable to sign in.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="staff-auth-page">
      <div className="staff-auth-glow staff-auth-glow-one" />
      <div className="staff-auth-glow staff-auth-glow-two" />

      <section className="staff-auth-shell">
        <div className="staff-auth-visual">
          <div className="staff-auth-brand">
            <div className="staff-auth-brand-mark">C</div>
            <div>
              <strong>Clock Tower</strong>
              <span>STAFF MANAGEMENT</span>
            </div>
          </div>

          <div className="staff-auth-visual-copy">
            <span className="staff-auth-kicker">PRIVATE STAFF PORTAL</span>
            <h1 style={serif}>
              Run the restaurant
              <br />
              <span>beautifully.</span>
            </h1>
            <p>
              Manage menus, orders, kitchen operations, inventory and guest
              service from one refined workspace.
            </p>
          </div>

          <div className="staff-auth-mini-grid">
            <div>
              <ChefHat size={18} />
              <span>Kitchen</span>
              <strong>Live control</strong>
            </div>
            <div>
              <ClipboardList size={18} />
              <span>Orders</span>
              <strong>Instant updates</strong>
            </div>
            <div>
              <Warehouse size={18} />
              <span>Inventory</span>
              <strong>Stock aware</strong>
            </div>
            <div>
              <CreditCard size={18} />
              <span>Payments</span>
              <strong>UPI ready</strong>
            </div>
          </div>
        </div>

        <div className="staff-auth-card-wrap">
          <div className="staff-auth-card">
            <div className="staff-auth-head">
              <div>
                <span className="staff-auth-card-kicker">WELCOME BACK</span>
                <h2 style={serif}>Admin login</h2>
                <p>
                  Sign in with the administrator account created in Firebase
                  Authentication.
                </p>
              </div>

              <div className="staff-auth-secure-icon">
                <SettingsIcon size={21} />
              </div>
            </div>

            <form className="staff-auth-form" onSubmit={submitLogin}>
              <div className="staff-auth-field">
                <label>Admin email</label>
                <div className="staff-auth-input-wrap">
                  <UserCircle2 size={17} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="staff-auth-field">
                <label>Password</label>
                <div className="staff-auth-input-wrap">
                  <SettingsIcon size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="staff-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="staff-auth-submit"
                disabled={loading}
              >
                <span>{loading ? "Signing in..." : "Sign in to dashboard"}</span>
                {loading ? (
                  <Sparkles size={17} />
                ) : (
                  <ChevronLeft
                    size={17}
                    style={{ transform: "rotate(180deg)" }}
                  />
                )}
              </button>
            </form>

            {error && (
              <div className="staff-auth-message error">
                <AlertTriangle size={15} />
                {error}
              </div>
            )}

            <div className="staff-auth-card-footer">
              <button type="button" onClick={() => nav("landing")}>
                ← Back to restaurant site
              </button>
              <span>Staff-only access · Firebase Authentication</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   ADMIN NAVIGATION
   ========================================================= */

const NAV_ITEMS = [
  { k: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { k: "pos", label: "POS / Billing", icon: CircleDollarSign },
  { k: "kitchen", label: "Kitchen Management", icon: ChefHat },
  { k: "tables", label: "Tables & Orders", icon: LayoutGrid },
  { k: "reservations", label: "Reservations", icon: CalendarDays },
  { k: "rooms", label: "Rooms & Stay", icon: BedDouble },
  { k: "orders", label: "Orders", icon: ClipboardList },
  { k: "delivery", label: "Delivery", icon: Truck },
  { k: "website", label: "Website Content", icon: ImageIcon },
  { k: "products", label: "Menu & Products", icon: Package },
  { k: "pricing", label: "Price & Menu", icon: Tag },
  { k: "offers", label: "Offers & Banners", icon: Flame },
  { k: "inventory", label: "Inventory", icon: Warehouse },
  { k: "purchasing", label: "Purchasing", icon: ShoppingCart },
  { k: "staff", label: "Staff & Duties", icon: Users },
  { k: "customers", label: "Customers", icon: UserCircle2 },
  { k: "payments", label: "Payments / UPI", icon: CreditCard },
  { k: "reports", label: "Reports & Analytics", icon: BarChart3 },
  { k: "audit", label: "Audit Logs", icon: ShieldCheck },
  { k: "branches", label: "Branches", icon: GitBranch },
  { k: "arMenu", label: "AR Menu", icon: Sparkles },
  { k: "settings", label: "Settings", icon: SettingsIcon }
];

/* =========================================================
   ROOMS & STAY SIDEBAR SUBMENU
   ========================================================= */
const ROOM_SUBNAV = [
  { key: "dashboard", label: "Room Dashboard", icon: LayoutDashboard },
  { key: "rooms", label: "Rooms", icon: BedDouble },
  { key: "categories", label: "Room Categories", icon: Tag },
  { key: "availability", label: "Availability", icon: CalendarDays },
  { key: "bookings", label: "Room Bookings", icon: ClipboardList },
  { key: "checkin", label: "Check-in", icon: LogIn },
  { key: "checkout", label: "Check-out", icon: LogOut },
  { key: "housekeeping", label: "Housekeeping", icon: Sparkles },
  { key: "rates", label: "Room Rates", icon: CircleDollarSign },
  { key: "settings", label: "Room Settings", icon: SettingsIcon }
];

/* =========================================================
   ADMIN ERROR BOUNDARY
   ========================================================= */

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("Admin section error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="admin-section-error">
          <AlertTriangle size={24} />
          <h3>That section could not be loaded</h3>
          <p>{this.state.error?.message || "Unexpected admin section error."}</p>
          <button type="button" className="admin-retry-button" onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

/* =========================================================
   ADMIN APP
   ========================================================= */

function AdminApp(props) {
  const [section, setSection] = useState("dashboard");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roomMenuOpen, setRoomMenuOpen] = useState(() => {
    try { return localStorage.getItem("clocktower-room-menu-open") === "1"; } catch { return false; }
  });
  const [roomActiveTab, setRoomActiveTab] = useState(() => {
    try { return localStorage.getItem("clocktower-room-tab") || "dashboard"; } catch { return "dashboard"; }
  });
  const [branchId, setBranchId] = useState(() => {
    try { return localStorage.getItem("kaveri-selected-branch") || (props.currentStaff?.branchId || "all"); } catch { return props.currentStaff?.branchId || "all"; }
  });
  const { onLogout, nav } = props;

  /* =========================================================
     FIRESTORE BRIDGE
     Keep the existing admin UI/components intact, but make the
     AdminApp itself the single realtime source for shared data.
     ========================================================= */
  const [connectedProducts, setConnectedProducts] = useState(() => Array.isArray(props.products) ? props.products : []);
  const [connectedOrders, setConnectedOrders] = useState(() => Array.isArray(props.orders) ? props.orders : []);
  const [connectedStaff, setConnectedStaff] = useState(() => Array.isArray(props.staff) ? props.staff : []);
  const [connectedInventory, setConnectedInventory] = useState(() => Array.isArray(props.inventory) ? props.inventory : []);
  const [connectedTables, setConnectedTables] = useState(() => Array.isArray(props.tables) ? props.tables : []);
  const [connectedSiteContent, setConnectedSiteContent] = useState(() => ({ ...seedSiteContent(), ...(props.siteContent || {}) }));
  const [connectedPaymentSettings, setConnectedPaymentSettings] = useState(() => ({ ...seedPaymentSettings(), ...(props.paymentSettings || {}) }));
  const [connectedHotel, setConnectedHotel] = useState(() => ({
    name: "Kaveri Kitchen",
    phone: "+91 98765 43210",
    address: "44 MG Road, Guwahati, Assam",
    about: "A modern restaurant serving Indian, Chinese and Italian favourites — dine-in, takeaway or delivered to your door.",
    logo: "",
    ...(props.hotel || {})
  }));
  const [connectedOfferBanners, setConnectedOfferBanners] = useState(() =>
    Array.isArray(props.offerBanners)
      ? props.offerBanners
      : (Array.isArray(props.siteContent?.offerBanners) ? props.siteContent.offerBanners : seedSiteContent().offerBanners)
  );

  const writeSharedSiteContent = async (next) => {
    try {
      setConnectedSiteContent(next);
      if (Array.isArray(next?.offerBanners)) setConnectedOfferBanners(next.offerBanners);
      await setDoc(doc(db, "settings", "siteContent"), { ...next, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Website content sync failed:", error);
      window.alert(error?.message || "Unable to sync website content to Firebase.");
    }
  };

  const writeOfferBanners = (updater) => {
    const next = typeof updater === "function" ? updater(connectedOfferBanners) : updater;
    const safe = Array.isArray(next) ? next : [];
    setConnectedOfferBanners(safe);
    setConnectedSiteContent((content) => ({ ...content, offerBanners: safe }));
    setDoc(doc(db, "settings", "siteContent"), { offerBanners: safe, updatedAt: serverTimestamp() }, { merge: true })
      .catch((error) => {
        console.error("Offer banner sync failed:", error);
        window.alert(error?.message || "Unable to sync offer banners to Firebase.");
      });
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setConnectedProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Admin products sync error:", error));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      setConnectedOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    }, (error) => console.error("Admin orders sync error:", error));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "staff"), (snap) => {
      setConnectedStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Admin staff sync error:", error));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snap) => {
      setConnectedInventory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Admin inventory sync error:", error));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tables"), (snap) => {
      setConnectedTables(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Admin tables sync error:", error));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteContent"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setConnectedSiteContent((current) => ({ ...current, ...data }));
      if (Array.isArray(data.offerBanners)) setConnectedOfferBanners(data.offerBanners);
    }, (error) => console.error("Admin site content sync error:", error));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "paymentSettings"), (snap) => {
      if (snap.exists()) setConnectedPaymentSettings((current) => ({ ...current, ...snap.data() }));
    }, (error) => console.error("Admin payment settings sync error:", error));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "hotel"), (snap) => {
      if (snap.exists()) setConnectedHotel((current) => ({ ...current, ...snap.data() }));
    }, (error) => console.error("Admin hotel settings sync error:", error));
    return () => unsub();
  }, []);

  const openRoomTab = (tab) => {
    setRoomActiveTab(tab);
    setRoomMenuOpen(true);
    try {
      localStorage.setItem("clocktower-room-tab", tab);
      localStorage.setItem("clocktower-room-menu-open", "1");
    } catch {}
    chooseSection("rooms");
  };

  const toggleRooms = () => {
    const next = !roomMenuOpen;
    setRoomMenuOpen(next);
    if (next) {
      chooseSection("rooms");
    }
    try { localStorage.setItem("clocktower-room-menu-open", next ? "1" : "0"); } catch {}
  };

  const connectedProps = {
    ...props,
    products: connectedProducts,
    setProducts: setConnectedProducts,
    orders: connectedOrders,
    setOrders: setConnectedOrders,
    staff: connectedStaff,
    setStaff: setConnectedStaff,
    inventory: connectedInventory,
    setInventory: setConnectedInventory,
    tables: connectedTables,
    setTables: setConnectedTables,
    siteContent: connectedSiteContent,
    setSiteContent: writeSharedSiteContent,
    offerBanners: connectedOfferBanners,
    setOfferBanners: writeOfferBanners,
    paymentSettings: connectedPaymentSettings,
    setPaymentSettings: setConnectedPaymentSettings,
    hotel: connectedHotel,
    setHotel: setConnectedHotel
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => item.k === "dashboard" || canAccessSection(props.currentStaff, item.k === "reservations" ? "orders" : item.k));
  const activeItem = visibleNavItems.find((item) => item.k === section) || visibleNavItems[0] || NAV_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  useEffect(() => {
    try { localStorage.setItem("kaveri-selected-branch", branchId); } catch {}
  }, [branchId]);

  useEffect(() => {
    if (!visibleNavItems.some((item) => item.k === section)) setSection("dashboard");
  }, [section, props.currentStaff?.role]);

  const chooseSection = (key) => {
    setSection(key);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="admin-shell admin-shell-modern">
      <div className="admin-mobile-header">
        <button
          type="button"
          className="admin-mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open admin menu"
          aria-expanded={mobileMenuOpen}
        >
          <Menu size={21} />
        </button>
        <div className="admin-mobile-brand">
          <div className="admin-mobile-brand-mark">{restaurantInitial(props.hotel?.name)}</div>
          <div>
            <strong>{connectedProps.hotel?.name || "Kaveri Kitchen"}</strong>
            <span>STAFF CONSOLE</span>
          </div>
        </div>
        <div className="admin-mobile-header-actions">
          <div className="admin-mobile-branch">
            <BranchSelector value={branchId} onChange={setBranchId} currentStaff={props.currentStaff} />
          </div>
          <button type="button" className="admin-mobile-logout" onClick={onLogout} aria-label="Logout">
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="admin-mobile-menu-layer">
          <button
            type="button"
            className="admin-mobile-menu-backdrop"
            aria-label="Close admin menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="admin-mobile-drawer" aria-label="Mobile admin menu">
            <div className="admin-mobile-drawer-head">
              <div className="admin-mobile-drawer-brand">
                <div className="admin-mobile-brand-mark">{restaurantInitial(props.hotel?.name)}</div>
                <div>
                  <strong>{connectedProps.hotel?.name || "Kaveri Kitchen"}</strong>
                  <span>STAFF CONSOLE</span>
                </div>
              </div>
              <button type="button" className="admin-mobile-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={21} />
              </button>
            </div>

            <div className="admin-mobile-drawer-branch">
              <span>Branch</span>
              <BranchSelector value={branchId} onChange={setBranchId} currentStaff={props.currentStaff} />
            </div>

            <div className="admin-mobile-menu-list">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.k;
                if (item.k !== "rooms") {
                  return (
                    <button key={item.k} type="button" className={active ? "active" : ""} onClick={() => chooseSection(item.k)}>
                      <span className="admin-mobile-menu-icon"><Icon size={17} /></span>
                      <span>{item.label}</span>
                    </button>
                  );
                }
                return (
                  <div key={item.k} className={`admin-room-nav-group ${active ? "active" : ""}`}>
                    <button type="button" className={active ? "active" : ""} onClick={toggleRooms}>
                      <span className="admin-mobile-menu-icon"><Icon size={17} /></span>
                      <span>{item.label}</span><span className="admin-room-nav-chevron">{roomMenuOpen ? "⌃" : "⌄"}</span>
                    </button>
                    {roomMenuOpen && (
                      <div className="admin-room-subnav mobile-room-subnav">
                        {ROOM_SUBNAV.map((sub) => { const SubIcon = sub.icon; return <button key={sub.key} type="button" className={roomActiveTab === sub.key && active ? "active" : ""} onClick={() => openRoomTab(sub.key)}><SubIcon size={14} /><span>{sub.label}</span></button>; })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="admin-mobile-drawer-footer">
              <div>
                <strong>{connectedProps.hotel?.name || "Kaveri Kitchen"}</strong>
                <span>Restaurant Admin</span>
              </div>
              <button type="button" onClick={onLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      <header className="admin-top-navigation">
        <div className="admin-top-brand">
          <div className="admin-top-brand-mark">{restaurantInitial(props.hotel?.name)}</div>
          <div>
            <strong>{connectedProps.hotel?.name || "Kaveri Kitchen"}</strong>
            <span>STAFF CONSOLE</span>
          </div>
        </div>

        <nav className="admin-top-nav-scroll" aria-label="Admin navigation">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.k;
            if (item.k !== "rooms") {
              return <button key={item.k} type="button" className={active ? "active" : ""} onClick={() => chooseSection(item.k)}><Icon size={15} /><span>{item.label}</span></button>;
            }
            return (
              <div key={item.k} className={`admin-room-nav-group ${active ? "active" : ""}`}>
                <button type="button" className={active ? "active" : ""} onClick={toggleRooms}><Icon size={15} /><span>{item.label}</span><span className="admin-room-nav-chevron">{roomMenuOpen ? "⌃" : "⌄"}</span></button>
                {roomMenuOpen && <div className="admin-room-subnav">{ROOM_SUBNAV.map((sub) => { const SubIcon = sub.icon; return <button key={sub.key} type="button" className={roomActiveTab === sub.key && active ? "active" : ""} onClick={() => openRoomTab(sub.key)}><SubIcon size={13} /><span>{sub.label}</span></button>; })}</div>}
              </div>
            );
          })}
        </nav>

        <div className="admin-top-actions">
          <BranchSelector value={branchId} onChange={setBranchId} currentStaff={props.currentStaff} />
          <div className="admin-notification-wrap">
            <button
              type="button"
              className="admin-top-icon"
              title="Notifications"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((v) => !v)}
            >
              <Bell size={17} />
              {Array.isArray(props.orders) && props.orders.some((o) => ["New", "Preparing"].includes(o.status)) && (
                <span className="admin-notification-count">
                  {props.orders.filter((o) => ["New", "Preparing"].includes(o.status)).length}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="admin-notification-popover">
                <div className="admin-notification-popover-head">
                  <strong>Notifications</strong>
                  <button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">×</button>
                </div>
                {Array.isArray(props.orders) && props.orders.filter((o) => ["New", "Preparing"].includes(o.status)).length > 0 ? (
                  props.orders
                    .filter((o) => ["New", "Preparing"].includes(o.status))
                    .slice(0, 5)
                    .map((o) => (
                      <button
                        type="button"
                        className="admin-notification-item"
                        key={o.id || o.orderNumber}
                        onClick={() => { setNotificationsOpen(false); chooseSection("orders"); }}
                      >
                        <span>{o.orderNumber || o.id || "Order"}</span>
                        <small>{o.status} · {o.customer?.name || o.customer || "Customer"}</small>
                      </button>
                    ))
                ) : (
                  <div className="admin-notification-empty">No new operational notifications.</div>
                )}
              </div>
            )}
          </div>
          <div className="admin-profile-chip" title={props.currentStaff?.name || "Current staff"}>
            <span>{String(props.currentStaff?.name || "KK").split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase()}</span>
          </div>
          <button type="button" className="admin-top-logout" onClick={onLogout}>
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="admin-main admin-main-modern">
        <div className="admin-page-head">
          <div>
            <span className="admin-page-kicker">STAFF WORKSPACE</span>
            <h1 style={serif}>{activeItem.label}</h1>
            <p>Everything you need to keep the restaurant running smoothly.</p>
          </div>
          <div className="admin-current-module">
            <ActiveIcon size={17} />
            <span>Live workspace</span>
          </div>
        </div>

        <div className="admin-content">
          <AdminErrorBoundary key={section}>
            {section === "dashboard" && <AdminDashboard {...connectedProps} branchId={branchId} onBranchChange={setBranchId} />}
            {section === "pos" && <AdminPOS {...connectedProps} branchId={branchId} />}
            {section === "kitchen" && <AdminKitchen {...connectedProps} branchId={branchId} />}
            {section === "website" && <AdminWebsiteContent {...connectedProps} />}
            {section === "products" && <AdminProducts {...connectedProps} />}
            {section === "pricing" && <AdminPricing {...connectedProps} />}
            {section === "staff" && <><AdminStaff {...connectedProps} /><AdminStaffPermissions {...connectedProps} branchId={branchId} /></>}
            {section === "inventory" && <><AdminInventory {...connectedProps} /><AdminRecipes {...connectedProps} branchId={branchId} /></>}
            {section === "purchasing" && <AdminPurchasing {...connectedProps} branchId={branchId} currentStaff={props.currentStaff} />}
            {section === "tables" && <AdminTables {...connectedProps} />}
            {section === "reservations" && <AdminReservations {...connectedProps} branchId={branchId} currentStaff={props.currentStaff} />}
            {section === "rooms" && <RoomManagement currentStaff={props.currentStaff} branchId={branchId} initialTab={roomActiveTab} onTabChange={setRoomActiveTab} />}
            {section === "orders" && <AdminOrders {...connectedProps} />}
            {section === "delivery" && <AdminDelivery {...connectedProps} />}
            {section === "reports" && <AdminReports {...connectedProps} branchId={branchId} />}
            {section === "audit" && <AdminAuditLogs {...connectedProps} branchId={branchId} />}
            {section === "branches" && <AdminBranches {...connectedProps} />}
            {section === "payments" && <><AdminPayments {...connectedProps} /><AdminTransactions {...connectedProps} branchId={branchId} /><AdminInvoices {...connectedProps} branchId={branchId} /></>}
            {section === "customers" && <AdminCustomers {...connectedProps} />}
            {section === "offers" && <AdminOffers {...connectedProps} />}
            {section === "arMenu" && <AdminARMenu {...connectedProps} />}
            {section === "settings" && <><AdminSettings {...connectedProps} /><AdminTaxSettings {...props} branchId={branchId} /></>}
          </AdminErrorBoundary>
        </div>

        <div className="admin-desktop-footer-actions">
          <button type="button" onClick={() => nav("landing")}>
            <ChevronLeft size={15} /> View restaurant site
          </button>
          <span>Staff Console • {connectedProps.hotel?.name || "Kaveri Kitchen"}</span>
        </div>
      </main>

      <nav className="admin-bottom-nav" aria-label="Mobile admin navigation">
        <div className="admin-bottom-nav-scroll">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.k;
            return (
              <button
                key={item.k}
                type="button"
                className={active ? "active" : ""}
                onClick={() => chooseSection(item.k)}
              >
                <span className="admin-bottom-icon-wrap">
                  <Icon size={16} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* =========================================================
   ADMIN SHARED COMPONENTS
   ========================================================= */

function Panel({
  title,
  children,
  right
}) {
  return (
    <div
      className="admin-card"
      style={{
        padding: 20,
        marginBottom: 20
      }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom: 17
          }}
        >
          <div
            style={{
              fontWeight: 750,
              fontSize: 15,
              color: INK
            }}
          >
            {title}
          </div>

          {right}
        </div>
      )}

      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone
}) {
  return (
    <div
      className="stat-card"
      style={{
        padding: 19
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#8A7770",
          fontWeight: 650
        }}
      >
        {label}
      </div>

      <div
        className="admin-stat-value"
        style={{
          fontSize: 27,
          fontWeight: 800,
          marginTop: 8,
          color:
            tone === "brass"
              ? BRASS
              : INK,
          ...serif
        }}
      >
        {value}
      </div>
    </div>
  );
}

function IconBtn({
  icon: Icon,
  onClick,
  tone = "default"
}) {
  const danger =
    tone === "danger";

  return (
    <button
      onClick={onClick}
      style={{
        background: danger
          ? "#fde8e3"
          : "#fff3ed",
        border: 0,
        borderRadius: 9,
        width: 33,
        height: 33,
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        cursor: "pointer",
        color: danger
          ? "#C84632"
          : INK
      }}
    >
      <Icon size={14} />
    </button>
  );
}

function Toggle({
  on,
  onClick,
  good
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        border: 0,
        cursor: "pointer",
        background: on
          ? good
            ? "#62855A"
            : BRASS
          : "#dccdc6",
        position: "relative"
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition:
            "left .15s"
        }}
      />
    </button>
  );
}

/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

function AdminDashboard({
  orders = [],
  tables = [],
  inventory = [],
  products = [],
  branchId = "all",
  onBranchChange,
  currentStaff
}) {
  const [paymentRows, setPaymentRows] = useState([]);
  const [expenseRows, setExpenseRows] = useState([]);
  const [activityRows, setActivityRows] = useState([]);
  const [branchRows, setBranchRows] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const toDate = (value) => {
    if (!value) return null;
    try {
      if (typeof value?.toDate === "function") return value.toDate();
      if (value instanceof Date) return value;
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const valueNumber = (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  };

  const isSameDay = (value, target = new Date()) => {
    const d = toDate(value);
    if (!d) return false;
    return d.getFullYear() === target.getFullYear()
      && d.getMonth() === target.getMonth()
      && d.getDate() === target.getDate();
  };

  const branchMatches = (row) => {
    if (!branchId || branchId === "all") return true;
    return String(row?.branchId || "") === String(branchId);
  };

  useEffect(() => {
    let active = true;
    setDashboardLoading(true);
    const unsubs = [];

    const listen = (collectionName, setter) => {
      try {
        const unsub = onSnapshot(
          collection(db, collectionName),
          (snapshot) => {
            if (!active) return;
            setter(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
            setDashboardLoading(false);
          },
          (error) => {
            console.warn(`Dashboard ${collectionName} listener unavailable:`, error);
            if (!active) return;
            setter([]);
            setDashboardLoading(false);
          }
        );
        unsubs.push(unsub);
      } catch (error) {
        console.warn(`Dashboard ${collectionName} listener failed:`, error);
        setter([]);
      }
    };

    listen("payments", setPaymentRows);
    listen("expenses", setExpenseRows);
    listen("auditLogs", setActivityRows);
    listen("branches", setBranchRows);

    return () => {
      active = false;
      unsubs.forEach((unsub) => {
        try { unsub(); } catch {}
      });
    };
  }, []);

  const todayOrders = useMemo(
    () => (Array.isArray(orders) ? orders : []).filter((order) =>
      branchMatches(order) && isSameDay(order.createdAt || order.updatedAt || order.date)
    ),
    [orders, branchId]
  );

  const todayPayments = useMemo(
    () => paymentRows.filter((row) =>
      branchMatches(row) && isSameDay(row.createdAt || row.updatedAt || row.date)
    ),
    [paymentRows, branchId]
  );

  const todayExpenses = useMemo(
    () => expenseRows.filter((row) =>
      branchMatches(row) && isSameDay(row.createdAt || row.updatedAt || row.date)
    ),
    [expenseRows, branchId]
  );

  const todayRevenueOrders = todayOrders.filter((order) => order.status !== "Cancelled");
  const grossSales = todayRevenueOrders.reduce((sum, order) => sum + valueNumber(order.subtotal ?? order.total), 0);
  const discounts = todayRevenueOrders.reduce((sum, order) => sum + valueNumber(order.discount), 0);
  const netSales = Math.max(0, grossSales - discounts);
  const taxes = todayRevenueOrders.reduce((sum, order) => {
    const taxObject = order.tax || {};
    return sum + valueNumber(taxObject.amount ?? order.taxAmount ?? order.taxTotal);
  }, 0);
  const expenses = todayExpenses.reduce((sum, row) => sum + valueNumber(row.amount ?? row.total ?? row.value), 0);
  const netProfit = netSales - expenses;
  const totalOrders = todayRevenueOrders.length;
  const averageOrderValue = totalOrders ? netSales / totalOrders : 0;
  const pending = todayOrders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length;
  const available = (Array.isArray(tables) ? tables : []).filter((table) =>
    branchMatches(table) && table.status === "Available"
  ).length;
  const lowStockItems = (Array.isArray(inventory) ? inventory : []).filter((item) => {
    if (!branchMatches(item)) return false;
    const qty = valueNumber(item.qty ?? item.stock ?? 0);
    const min = valueNumber(item.min ?? item.minimumStock ?? 0);
    return qty <= min;
  });

  const paymentBreakdown = useMemo(() => {
    const result = {};
    const paymentOrderIds = new Set();

    todayPayments.forEach((payment) => {
      const status = String(payment.status || "").toLowerCase();
      if (["refunded", "refund", "cancelled", "void"].includes(status)) return;
      const method = payment.method || payment.paymentMethod || "Other";
      result[method] = (result[method] || 0) + valueNumber(payment.amount);
      if (payment.orderId) paymentOrderIds.add(String(payment.orderId));
    });

    todayRevenueOrders.forEach((order) => {
      const orderId = String(order.id || order.orderNumber || "");
      if (orderId && paymentOrderIds.has(orderId)) return;
      const paidAmount = valueNumber(order.paid);
      if (!paidAmount) return;
      const method = order.paymentMethod || "Other";
      result[method] = (result[method] || 0) + paidAmount;
    });

    return Object.entries(result).sort((a, b) => b[1] - a[1]);
  }, [todayPayments, todayRevenueOrders]);

  const orderTypeBreakdown = useMemo(() => {
    const result = {};
    todayOrders.forEach((order) => {
      const type = order.type || "Other";
      result[type] = (result[type] || 0) + 1;
    });
    return Object.entries(result).sort((a, b) => b[1] - a[1]);
  }, [todayOrders]);

  const productPerformance = useMemo(() => {
    const map = {};
    todayRevenueOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = String(item.productId || item.id || item.name || "Unknown");
        if (!map[key]) map[key] = { id: key, name: item.name || "Unknown item", qty: 0, revenue: 0 };
        const qty = valueNumber(item.qty);
        map[key].qty += qty;
        map[key].revenue += qty * valueNumber(item.price);
      });
    });
    const rows = Object.values(map);
    return {
      top: rows.slice().sort((a, b) => b.revenue - a.revenue || b.qty - a.qty).slice(0, 5),
      worst: rows.slice().sort((a, b) => a.revenue - b.revenue || a.qty - b.qty).slice(0, 5)
    };
  }, [todayRevenueOrders]);

  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - offset);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = (Array.isArray(orders) ? orders : []).filter((order) => {
        if (!branchMatches(order) || String(order.status || "").toLowerCase() === "cancelled") return false;
        const created = toDate(order.createdAt || order.date);
        return created && created >= d && created < next;
      }).length;
      days.push({ label: d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 3), count });
    }
    return days;
  }, [orders, branchId]);

  const recentActivities = useMemo(() => {
    const orderActivities = todayOrders.map((order) => ({
      id: `order-${order.id || order.orderNumber}`,
      date: toDate(order.updatedAt || order.createdAt || order.date),
      title: `Order ${order.orderNumber || order.id || "created"}`,
      detail: `${order.type || "Order"} · ${money(order.total)} · ${order.status || "New"}`
    }));
    const auditActivities = activityRows
      .filter(branchMatches)
      .map((row) => ({
        id: `audit-${row.id}`,
        date: toDate(row.createdAt || row.date),
        title: row.action || "Activity",
        detail: `${row.module || "System"}${row.details ? ` · ${row.details}` : ""}`
      }));
    return [...orderActivities, ...auditActivities]
      .filter((row) => row.date)
      .sort((a, b) => b.date - a.date)
      .slice(0, 8);
  }, [todayOrders, activityRows, branchId]);

  const branchPerformance = useMemo(() => {
    const branches = branchRows.length
      ? branchRows.filter((b) => b.active !== false)
      : [
          { id: "branch-01", code: "Branch 01", name: "Branch 01", active: true },
          { id: "branch-02", code: "Branch 02", name: "Branch 02", active: true },
          { id: "branch-03", code: "Branch 03", name: "Branch 03", active: true }
        ];

    return branches.map((branch) => {
      const branchOrders = (Array.isArray(orders) ? orders : []).filter((order) =>
        String(order.branchId || "") === String(branch.id) &&
        isSameDay(order.createdAt || order.date) &&
        order.status !== "Cancelled"
      );
      const branchGross = branchOrders.reduce((sum, order) => sum + valueNumber(order.subtotal ?? order.total), 0);
      const branchDiscount = branchOrders.reduce((sum, order) => sum + valueNumber(order.discount), 0);
      const branchNet = Math.max(0, branchGross - branchDiscount);
      const branchExpense = (Array.isArray(expenseRows) ? expenseRows : [])
        .filter((expense) => String(expense.branchId || "") === String(branch.id) && isSameDay(expense.createdAt || expense.date))
        .reduce((sum, expense) => sum + valueNumber(expense.amount ?? expense.total), 0);
      return {
        id: branch.id,
        name: branch.code || branch.name || branch.id,
        orders: branchOrders.length,
        revenue: branchNet,
        expenses: branchExpense,
        profit: branchNet - branchExpense
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [branchRows, orders, expenseRows]);

  const maxWeekly = Math.max(1, ...weeklyTrend.map((item) => item.count));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "#8A7770", fontWeight: 750, letterSpacing: ".08em" }}>BUSINESS OVERVIEW</div>
          <div style={{ fontSize: 13, color: "#6f5d55", marginTop: 4 }}>
            Live business KPIs for {branchId === "all" ? "all branches" : branchRows.find((b) => b.id === branchId)?.name || branchId}.
          </div>
        </div>
        {typeof onBranchChange === "function" && (
          <BranchSelector value={branchId} onChange={onBranchChange} currentStaff={currentStaff} />
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 16 }}>
        <StatCard label="Today's Orders" value={todayOrders.length} />
        <StatCard label="Today's Revenue" value={money(netSales)} tone="brass" />
        <StatCard label="Pending Orders" value={pending} />
        <StatCard label="Available Tables" value={available} />
        <StatCard label="Low Stock Items" value={lowStockItems.length} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard label="Average Order Value" value={money(averageOrderValue)} />
        <StatCard label="Gross Sales" value={money(grossSales)} />
        <StatCard label="Net Sales" value={money(netSales)} tone="brass" />
        <StatCard label="Discounts" value={money(discounts)} />
        <StatCard label="Taxes" value={money(taxes)} />
        <StatCard label="Expenses" value={money(expenses)} />
        <StatCard label="Net Profit" value={money(netProfit)} tone={netProfit >= 0 ? "brass" : undefined} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(300px,1fr)", gap: 16, marginBottom: 16 }}>
        <Panel title="Orders this week">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 165 }}>
            {weeklyTrend.map((item) => (
              <div key={item.label} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                <div title={`${item.count} orders`} style={{ width: "100%", height: `${Math.max(5, (item.count / maxWeekly) * 130)}px`, background: item.label === weeklyTrend[weeklyTrend.length - 1].label ? BRASS : "#f5b7a5", borderRadius: "7px 7px 3px 3px", transition: "height .25s ease" }} />
                <span style={{ fontSize: 10, color: "#927f77" }}>{item.label}</span>
                <strong style={{ fontSize: 10, color: INK }}>{item.count}</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Payment breakdown">
          {paymentBreakdown.length ? paymentBreakdown.map(([method, amount]) => (
            <div key={method} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${LINE}`, fontSize: 13 }}>
              <span>{method}</span><strong style={{ color: BRASS }}>{money(amount)}</strong>
            </div>
          )) : <div style={{ color: "#8A7770", fontSize: 13, padding: "12px 0" }}>No payment data recorded today.</div>}
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 16 }}>
        <Panel title="Order type breakdown">
          {orderTypeBreakdown.length ? orderTypeBreakdown.map(([type, count]) => (
            <div key={type} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${LINE}` }}>
              <span>{type}</span><strong>{count} orders</strong>
            </div>
          )) : <div style={{ color: "#8A7770", fontSize: 13 }}>No orders recorded today.</div>}
        </Panel>

        <Panel title="Low-stock alerts">
          {lowStockItems.length ? lowStockItems.slice(0, 7).map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: `1px solid ${LINE}` }}>
              <span>{item.name || item.productName || item.id}</span>
              <strong style={{ color: "#C84632" }}>{valueNumber(item.qty ?? item.stock)} / min {valueNumber(item.min ?? item.minimumStock)}</strong>
            </div>
          )) : <div style={{ color: "#4F8A5D", fontSize: 13 }}>No low-stock items right now.</div>}
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 16 }}>
        <Panel title="Top performing products">
          {productPerformance.top.length ? productPerformance.top.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${LINE}` }}>
              <span>{item.name} <small style={{ color: "#8A7770" }}>×{item.qty}</small></span><strong style={{ color: BRASS }}>{money(item.revenue)}</strong>
            </div>
          )) : <div style={{ color: "#8A7770", fontSize: 13 }}>No product sales recorded today.</div>}
        </Panel>

        <Panel title="Worst performing products">
          {productPerformance.worst.length ? productPerformance.worst.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${LINE}` }}>
              <span>{item.name} <small style={{ color: "#8A7770" }}>×{item.qty}</small></span><strong>{money(item.revenue)}</strong>
            </div>
          )) : <div style={{ color: "#8A7770", fontSize: 13 }}>No product sales recorded today.</div>}
        </Panel>
      </div>

      <Panel title="Recent activity">
        {recentActivities.length ? recentActivities.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: `1px solid ${LINE}` }}>
            <div><strong style={{ fontSize: 13 }}>{item.title}</strong><div style={{ color: "#8A7770", fontSize: 11, marginTop: 3 }}>{item.detail}</div></div>
            <span style={{ color: "#8A7770", fontSize: 10, whiteSpace: "nowrap" }}>{item.date?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )) : <div style={{ color: "#8A7770", fontSize: 13 }}>No recent activity.</div>}
      </Panel>

      <Panel title="Branch comparison">
        {branchPerformance.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead><tr>{["Branch", "Orders", "Revenue", "Expenses", "Profit"].map((heading) => <th key={heading} style={{ textAlign: "left", padding: "0 10px 10px", fontSize: 11, color: "#8A7770" }}>{heading}</th>)}</tr></thead>
              <tbody>{branchPerformance.map((branch) => (
                <tr key={branch.id}>
                  <td style={{ padding: "11px 10px", borderTop: `1px solid ${LINE}` }}><strong>{branch.name}</strong></td>
                  <td style={{ padding: "11px 10px", borderTop: `1px solid ${LINE}` }}>{branch.orders}</td>
                  <td style={{ padding: "11px 10px", borderTop: `1px solid ${LINE}` }}>{money(branch.revenue)}</td>
                  <td style={{ padding: "11px 10px", borderTop: `1px solid ${LINE}` }}>{money(branch.expenses)}</td>
                  <td style={{ padding: "11px 10px", borderTop: `1px solid ${LINE}`, fontWeight: 800, color: branch.profit >= 0 ? "#4F8A5D" : "#C84632" }}>{money(branch.profit)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div style={{ color: "#8A7770", fontSize: 13 }}>No branch data available.</div>}
        {dashboardLoading && <div style={{ color: "#8A7770", fontSize: 11, marginTop: 10 }}>Syncing live dashboard data…</div>}
      </Panel>
    </div>
  );
}

/* =========================================================
   ADMIN PRODUCTS
   ========================================================= */

function AdminProducts({
  products,
  setProducts
}) {
  const [form, setForm] =
    useState({
      name: "",
      category: "Momo",
      qty: "",
      price: "",
      desc: ""
    });

  const addProduct = async () => {
    if (!form.name.trim() || !form.price) {
      return;
    }

    const product = {
      id: `p${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      rating: 4.5,
      veg: false,
      bestseller: false,
      available: true,
      qty: form.qty || "1 plate",
      desc: form.desc || "Freshly prepared.",
      img: categoryEmoji(form.category)
    };

    try {
      await setDoc(doc(db, "products", product.id), product);
      setProducts((current) => [...current, product]);
      setForm({
        name: "",
        category: "Momo",
        qty: "",
        price: "",
        desc: ""
      });
    } catch (error) {
      console.error("Product save failed:", error);
      window.alert(error?.message || "Unable to save product to Firebase.");
    }
  };

  const remove = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((current) =>
        current.filter((product) => product.id !== id)
      );
    } catch (error) {
      console.error("Product delete failed:", error);
      window.alert(error?.message || "Unable to delete product from Firebase.");
    }
  };

  const toggle = async (id, key) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    const nextValue = !product[key];

    try {
      await updateDoc(doc(db, "products", id), {
        [key]: nextValue
      });
      setProducts((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, [key]: nextValue }
            : item
        )
      );
    } catch (error) {
      console.error("Product update failed:", error);
      window.alert(error?.message || "Unable to update product in Firebase.");
    }
  };

  return (
    <div>

      <Panel title="Add Product">

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5,minmax(0,1fr)) auto",
            gap: 10,
            alignItems:
              "end"
          }}
        >
          <AdminField
            label="Dish Name"
            value={form.name}
            onChange={(value) =>
              setForm({
                ...form,
                name: value
              })
            }
          />

          <div>
            <div
              style={{
                fontSize: 11,
                marginBottom: 5,
                color: "#8a7770"
              }}
            >
              Category
            </div>

            <select
              value={
                form.category
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  category:
                    event.target
                      .value
                })
              }
              style={selStyle}
            >
              {CATEGORIES
                .filter(
                  (category) =>
                    category !==
                    "All"
                )
                .map(
                  (category) => (
                    <option
                      key={category}
                    >
                      {category}
                    </option>
                  )
                )}
            </select>
          </div>

          <AdminField
            label="Quantity"
            value={form.qty}
            onChange={(value) =>
              setForm({
                ...form,
                qty: value
              })
            }
            placeholder="e.g. 8 pcs"
          />

          <AdminField
            label="Price"
            value={form.price}
            onChange={(value) =>
              setForm({
                ...form,
                price: value
              })
            }
          />

          <AdminField
            label="Description"
            value={form.desc}
            onChange={(value) =>
              setForm({
                ...form,
                desc: value
              })
            }
          />

          <button
            onClick={addProduct}
            style={btnBrass}
          >
            Save Product
          </button>
        </div>
      </Panel>

      <Panel
        title={`All Products (${products.length})`}
      >
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {[
                  "Dish",
                  "Category",
                  "Price",
                  "Bestseller",
                  "Available",
                  ""
                ].map((heading) => (
                  <th key={heading}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {products.map(
                (product) => (
                  <tr
                    key={
                      product.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          product.name
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        product.category
                      }
                    </td>

                    <td>
                      {money(
                        product.price
                      )}
                    </td>

                    <td>
                      <Toggle
                        on={
                          product.bestseller
                        }
                        onClick={() =>
                          toggle(
                            product.id,
                            "bestseller"
                          )
                        }
                      />
                    </td>

                    <td>
                      <Toggle
                        on={
                          product.available
                        }
                        onClick={() =>
                          toggle(
                            product.id,
                            "available"
                          )
                        }
                        good
                      />
                    </td>

                    <td>
                      <IconBtn
                        icon={Trash2}
                        tone="danger"
                        onClick={() =>
                          remove(
                            product.id
                          )
                        }
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   ADMIN PRICING
   ========================================================= */

function AdminPricing({
  products,
  setProducts
}) {
  const updatePrice = async (id, price) => {
    const nextPrice = Number(price) || 0;

    try {
      await updateDoc(doc(db, "products", id), {
        price: nextPrice
      });
      setProducts((current) =>
        current.map((product) =>
          product.id === id
            ? { ...product, price: nextPrice }
            : product
        )
      );
    } catch (error) {
      console.error("Price update failed:", error);
      window.alert(error?.message || "Unable to update price in Firebase.");
    }
  };

  return (
    <Panel title="Price & Menu">

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {[
                "Dish",
                "Category",
                "Price",
                "Rating",
                "Availability"
              ].map(
                (heading) => (
                  <th key={heading}>
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {products.map(
              (product) => (
                <tr
                  key={
                    product.id
                  }
                >
                  <td>
                    {
                      product.name
                    }
                  </td>

                  <td>
                    {
                      product.category
                    }
                  </td>

                  <td>
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 5
                      }}
                    >
                      ₹

                      <input
                        defaultValue={
                          product.price
                        }
                        onBlur={(
                          event
                        ) =>
                          updatePrice(
                            product.id,
                            event.target
                              .value
                          )
                        }
                        style={{
                          width: 90,
                          padding:
                            "8px 10px",
                          border:
                            "1px solid rgba(76,21,4,0.12)",
                          borderRadius: 9,
                          color: INK,
                          background:
                            "#fff"
                        }}
                      />
                    </div>
                  </td>

                  <td>
                    ⭐{" "}
                    {
                      product.rating
                    }
                  </td>

                  <td>
                    <StatusBadge
                      status={
                        product.available
                          ? "In Stock"
                          : "Out of Stock"
                      }
                    />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* =========================================================
   STAFF
   ========================================================= */

const ROLES = [
  "Super Admin",
  "Owner",
  "Head Office Admin",
  "Branch Manager",
  "Cashier",
  "Waiter",
  "Kitchen Staff",
  "Delivery Partner",
  "Inventory Manager",
  "Accountant",
  "Manager",
  "Delivery Staff"
];

function AdminStaff({
  staff,
  setStaff,
  currentStaff,
  branchId = "all"
}) {
  const DUTIES = [
    "Kitchen",
    "Packing",
    "Cashier",
    "Dine-in",
    "Delivery",
    "Inventory"
  ];

  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    pin: "",
    role: "Waiter",
    duties: ["Dine-in"]
  });

  const add = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const employeeId = form.employeeId.trim().toUpperCase();
    const pin = form.pin.trim();

    if (!name || !email || !employeeId || !pin) {
      alert("Please fill Name, Email / Phone, Employee ID and PIN.");
      return;
    }

    if (!/^[0-9]{4,6}$/.test(pin)) {
      alert("PIN must contain 4 to 6 digits.");
      return;
    }

    const id = `s${Date.now()}`;

    const member = {
      id,
      name,
      email,
      employeeId,
      pin,
      role: form.role,
      duties: form.duties,
      active: true,
      branchId: branchId === "all" ? "branch-01" : branchId,
      permissions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, "staff", id), member, { merge: true });

      setStaff((current) => [
        ...current,
        { ...member, permissions: [] }
      ]);

      setForm({
        name: "",
        email: "",
        employeeId: "",
        pin: "",
        role: "Waiter",
        duties: ["Dine-in"]
      });

      alert(`Staff created successfully.\nEmployee ID: ${employeeId}`);
    } catch (error) {
      console.error("Staff save failed:", error);
      alert(error?.message || "Unable to save staff member to Firebase.");
    }
  };

  const toggleActive = async (id) => {
    const member = staff.find((item) => item.id === id);
    if (!member) return;

    const nextActive = !member.active;

    try {
      await updateDoc(doc(db, "staff", id), {
        active: nextActive,
        updatedAt: serverTimestamp()
      });

      setStaff((current) =>
        current.map((item) =>
          item.id === id ? { ...item, active: nextActive } : item
        )
      );
    } catch (error) {
      alert(error?.message || "Unable to update staff status.");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this staff member?")) return;

    try {
      await deleteDoc(doc(db, "staff", id));

      setStaff((current) =>
        current.filter((member) => member.id !== id)
      );
    } catch (error) {
      alert(error?.message || "Unable to remove staff member.");
    }
  };

  const toggleDuty = (duty) =>
    setForm((current) => ({
      ...current,
      duties: current.duties.includes(duty)
        ? current.duties.filter((item) => item !== duty)
        : [...current.duties, duty]
    }));

  const updateDuty = async (id, duty) => {
    const member = staff.find((item) => item.id === id);
    if (!member) return;

    const duties = (member.duties || []).includes(duty)
      ? (member.duties || []).filter((item) => item !== duty)
      : [...(member.duties || []), duty];

    try {
      await updateDoc(doc(db, "staff", id), {
        duties,
        updatedAt: serverTimestamp()
      });

      setStaff((current) =>
        current.map((item) =>
          item.id === id ? { ...item, duties } : item
        )
      );
    } catch (error) {
      alert(error?.message || "Unable to update duties.");
    }
  };

  return (
    <div>
      <Panel
        title="Add staff & assign duties"
        right={<Users size={16} color={BRASS} />}
      >
        <div className="staff-form-grid">
          <AdminField
            label="Name"
            value={form.name}
            onChange={(value) =>
              setForm({ ...form, name: value })
            }
          />

          <AdminField
            label="Email / phone"
            value={form.email}
            onChange={(value) =>
              setForm({ ...form, email: value })
            }
          />

          <AdminField
            label="Employee ID"
            value={form.employeeId}
            onChange={(value) =>
              setForm({
                ...form,
                employeeId: value
                  .toUpperCase()
                  .replace(/\s/g, "")
              })
            }
          />

          <AdminField
            label="Staff PIN"
            value={form.pin}
            onChange={(value) =>
              setForm({
                ...form,
                pin: value.replace(/\D/g, "").slice(0, 6)
              })
            }
          />

          <div>
            <div className="admin-mini-label">Role</div>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
              style={selStyle}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <button type="button" onClick={add} style={btnBrass}>
            <Plus size={14} />
            Add Staff
          </button>
        </div>

        <div className="duty-picker">
          <div className="admin-mini-label">Primary duties</div>

          {DUTIES.map((duty) => (
            <button
              type="button"
              key={duty}
              className={form.duties.includes(duty) ? "selected" : ""}
              onClick={() => toggleDuty(duty)}
            >
              {duty}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={`Team (${staff.length})`}>
        <div className="staff-cards-grid">
          {staff.map((member) => (
            <article className="staff-admin-card" key={member.id}>
              <div className="staff-card-head">
                <div className="staff-avatar">
                  {String(member.name || "S")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>{member.name}</strong>
                  <span>{member.email}</span>

                  {member.employeeId && (
                    <small
                      style={{
                        display: "block",
                        marginTop: 3,
                        fontWeight: 700,
                        color: BRASS
                      }}
                    >
                      ID: {member.employeeId}
                    </small>
                  )}
                </div>

                <button
                  type="button"
                  className="icon-only-button"
                  onClick={() => remove(member.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="staff-role-line">
                <span>{member.role}</span>

                <button
                  type="button"
                  onClick={() => toggleActive(member.id)}
                  className={member.active ? "staff-live" : "staff-off"}
                >
                  {member.active ? "Active" : "Off Duty"}
                </button>
              </div>

              <div className="staff-duties-label">
                Assigned work
              </div>

              <div className="staff-duty-list">
                {DUTIES.map((duty) => (
                  <button
                    type="button"
                    key={duty}
                    className={
                      (member.duties || []).includes(duty)
                        ? "selected"
                        : ""
                    }
                    onClick={() => updateDuty(member.id, duty)}
                  >
                    {duty}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   INVENTORY
   ========================================================= */

function AdminInventory({
  inventory,
  setInventory
}) {
  const [form, setForm] =
    useState({
      name: "",
      qty: "",
      unit: "kg",
      min: ""
    });

  const add = async () => {
    if (!form.name.trim() || !form.qty) {
      return;
    }

    const item = {
      id: `i${Date.now()}`,
      name: form.name.trim(),
      qty: Number(form.qty),
      unit: form.unit,
      min: Number(form.min) || 1,
      supplier: "—",
      updated: "Just now"
    };

    try {
      await setDoc(doc(db, "inventory", item.id), item);
      setInventory((current) => [...current, item]);
      setForm({ name: "", qty: "", unit: "kg", min: "" });
    } catch (error) {
      console.error("Inventory save failed:", error);
      window.alert(error?.message || "Unable to save inventory to Firebase.");
    }
  };

  const adjust = async (id, delta) => {
    const item = inventory.find((entry) => entry.id === id);
    if (!item) return;

    const currentQty = Number(item.qty ?? item.stock ?? 0);
    const nextQty = Math.max(0, currentQty + delta);

    try {
      await updateDoc(doc(db, "inventory", id), {
        qty: nextQty,
        updated: "Just now"
      });
      setInventory((current) =>
        current.map((entry) =>
          entry.id === id
            ? { ...entry, qty: nextQty, updated: "Just now" }
            : entry
        )
      );
    } catch (error) {
      console.error("Inventory update failed:", error);
      window.alert(error?.message || "Unable to update inventory in Firebase.");
    }
  };

  const statusFor = (item) => {
    const qty =
      item.qty ??
      item.stock ??
      0;

    const min =
      item.min ?? 0;

    if (qty === 0) {
      return "Out of Stock";
    }

    if (qty <= min) {
      return "Low Stock";
    }

    return "In Stock";
  };

  return (
    <div>

      <Panel title="Add Inventory Item">

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr 1fr 1fr auto",
            gap: 10,
            alignItems:
              "end"
          }}
        >
          <AdminField
            label="Item name"
            value={form.name}
            onChange={(value) =>
              setForm({
                ...form,
                name: value
              })
            }
          />

          <AdminField
            label="Quantity"
            value={form.qty}
            onChange={(value) =>
              setForm({
                ...form,
                qty: value
              })
            }
          />

          <div>
            <div
              style={{
                fontSize: 11,
                marginBottom: 5,
                color:
                  "#8a7770"
              }}
            >
              Unit
            </div>

            <select
              value={form.unit}
              onChange={(event) =>
                setForm({
                  ...form,
                  unit:
                    event.target
                      .value
                })
              }
              style={selStyle}
            >
              {[
                "kg",
                "pcs",
                "bottles",
                "litres",
                "packs"
              ].map(
                (unit) => (
                  <option
                    key={unit}
                  >
                    {unit}
                  </option>
                )
              )}
            </select>
          </div>

          <AdminField
            label="Minimum stock"
            value={form.min}
            onChange={(value) =>
              setForm({
                ...form,
                min: value
              })
            }
          />

          <button
            onClick={add}
            style={btnBrass}
          >
            Add Item
          </button>
        </div>
      </Panel>

      <Panel title="Stock">

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {[
                  "Item",
                  "Stock",
                  "Min",
                  "Supplier",
                  "Status",
                  "Updated",
                  "Adjust"
                ].map(
                  (heading) => (
                    <th
                      key={
                        heading
                      }
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {inventory.map(
                (item) => {
                  const qty =
                    item.qty ??
                    item.stock ??
                    0;

                  const name =
                    item.name ??
                    item.item ??
                    "Unnamed";

                  return (
                    <tr
                      key={
                        item.id
                      }
                    >
                      <td>
                        {name}
                      </td>

                      <td>
                        {qty}{" "}
                        {
                          item.unit
                        }
                      </td>

                      <td>
                        {item.min ??
                          0}{" "}
                        {
                          item.unit
                        }
                      </td>

                      <td>
                        {item.supplier ??
                          "—"}
                      </td>

                      <td>
                        <StatusBadge
                          status={statusFor(
                            item
                          )}
                        />
                      </td>

                      <td>
                        {
                          item.updated
                        }
                      </td>

                      <td>
                        <div
                          style={{
                            display:
                              "flex",
                            gap: 5
                          }}
                        >
                          <IconBtn
                            icon={
                              Minus
                            }
                            onClick={() =>
                              adjust(
                                item.id,
                                -1
                              )
                            }
                          />

                          <IconBtn
                            icon={
                              Plus
                            }
                            onClick={() =>
                              adjust(
                                item.id,
                                1
                              )
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   TABLES
   ========================================================= */

function AdminTables({ tables = [], setTables, products = [], orders = [], branchId = "all", currentStaff }) {
  const [openId, setOpenId] = useState(null);
  const [sectionFilter, setSectionFilter] = useState("All");
  const [saving, setSaving] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [floorForm, setFloorForm] = useState({ name: "", capacity: 4, section: "Main Hall", status: "Available" });
  const [localTables, setLocalTables] = useState(Array.isArray(tables) ? tables : []);

  useEffect(() => setLocalTables(Array.isArray(tables) ? tables : []), [tables]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "tables"),
      snap => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = branchId && branchId !== "all" ? rows.filter(t => t.branchId === branchId) : rows;
        setLocalTables(filtered);
      },
      err => console.error("Table listener error:", err)
    );
    return () => unsub();
  }, [branchId]);

  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reservations"), snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReservations(branchId && branchId !== "all" ? rows.filter(r => r.branchId === branchId) : rows);
    }, err => console.error("Reservation listener error:", err));
    return () => unsub();
  }, [branchId]);
  const tableList = localTables.length ? localTables : (Array.isArray(tables) ? tables : []);
  const activeOrders = (Array.isArray(orders) ? orders : []).filter(o => o.status !== "Cancelled" && o.status !== "Delivered");
  const sections = ["All", ...Array.from(new Set(tableList.map(t => t.section || "Main Hall")))];
  const visibleTables = tableList.filter(t => sectionFilter === "All" || (t.section || "Main Hall") === sectionFilter);
  const selected = tableList.find(t => t.id === openId);
  const selectedOrder = selected ? activeOrders.find(o => String(o.table || o.tableNumber || o.tableId) === String(selected.id)) : null;
  const selectedReservation = selected ? reservations.find(r => String(r.tableId || r.table) === String(selected.id) && !["Cancelled","Completed","No-show"].includes(r.status)) : null;
  const subtotal = items => (items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  const moneyLocal = n => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const persist = async (id, patch, successMessage) => {
    try {
      setSaving(true);
      await updateDoc(doc(db, "tables", id), { ...patch, updatedAt: serverTimestamp(), updatedBy: currentStaff?.uid || currentStaff?.id || "unknown" });
      setLocalTables(cur => cur.map(t => t.id === id ? { ...t, ...patch } : t));
      if (setTables) setTables(cur => cur.map(t => t.id === id ? { ...t, ...patch } : t));
      if (successMessage) alert(successMessage);
    } catch (error) {
      console.error("Table operation failed:", error);
      alert(error?.message || "Unable to update table.");
    } finally { setSaving(false); }
  };

  const addTable = async () => {
    if (!String(floorForm.name).trim()) return alert("Table name is required.");
    if (Number(floorForm.capacity) < 1) return alert("Table capacity must be at least 1.");
    try {
      setSaving(true);
      const id = `table-${Date.now()}`;
      const data = { id, name: floorForm.name.trim(), capacity: Number(floorForm.capacity), seats: Number(floorForm.capacity), section: floorForm.section.trim() || "Main Hall", status: floorForm.status || "Available", branchId: branchId || "all", orderId: null, customerId: null, reservationId: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: currentStaff?.uid || currentStaff?.id || "unknown" };
      await setDoc(doc(db, "tables", id), data);
      if (setTables) setTables(cur => [...cur, { ...data, createdAt: new Date(), updatedAt: new Date() }]);
      setFloorForm({ name: "", capacity: 4, section: floorForm.section || "Main Hall", status: "Available" });
      alert("Table added successfully.");
    } catch (error) { console.error("Add table failed:", error); alert(error?.message || "Unable to add table."); }
    finally { setSaving(false); }
  };

  const setStatus = async status => {
    if (!selected) return;
    if (status === "Available" && selectedOrder && Number(selectedOrder.due || selectedOrder.balance || 0) > 0) return alert("This table still has an unpaid bill. Settle the bill before closing the table.");
    await persist(selected.id, { status, occupiedAt: status === "Occupied" ? (selected.occupiedAt || serverTimestamp()) : null }, `Table marked ${status}.`);
  };

  const updateLinkedOrder = async patch => {
    if (!selectedOrder) return alert("No active order is linked to this table.");
    try {
      setSaving(true);
      await updateDoc(doc(db, "orders", selectedOrder.id), { ...patch, updatedAt: serverTimestamp() });
      alert("Linked order updated successfully.");
    } catch (error) { console.error("Linked order update failed:", error); alert(error?.message || "Unable to update linked order."); }
    finally { setSaving(false); }
  };

  const transfer = async () => {
    if (!selected || !selectedOrder || !targetId) return alert("Select a target table first.");
    const target = tableList.find(t => t.id === targetId);
    if (!target || target.id === selected.id) return alert("Choose a different target table.");
    if (String(target.status) === "Occupied") return alert("Target table is occupied.");
    try {
      setSaving(true);
      await updateDoc(doc(db, "orders", selectedOrder.id), { table: target.id, tableId: target.id, tableNumber: target.name || target.id, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "tables", selected.id), { status: "Available", orderId: null, customerId: null, occupiedAt: null, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "tables", target.id), { status: "Occupied", orderId: selectedOrder.id, customerId: selectedOrder.customerId || null, occupiedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      alert(`Order ${selectedOrder.orderNumber || selectedOrder.id} transferred.`);
      setTargetId("");
    } catch (error) { console.error("Transfer failed:", error); alert(error?.message || "Unable to transfer order."); }
    finally { setSaving(false); }
  };

  const merge = async () => {
    if (!selected || !targetId) return alert("Select a target table first.");
    const target = tableList.find(t => t.id === targetId);
    if (!target || target.id === selected.id) return alert("Choose a different target table.");
    if (String(target.status) === "Occupied" && !selectedOrder) return alert("Target table is already occupied.");
    try {
      setSaving(true);
      if (selectedOrder) await updateDoc(doc(db, "orders", selectedOrder.id), { table: target.id, tableId: target.id, tableNumber: target.name || target.id, mergedFrom: selected.id, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "tables", target.id), { status: "Occupied", occupiedAt: serverTimestamp(), capacity: Number(target.capacity || target.seats || 0) + Number(selected.capacity || selected.seats || 0), seats: Number(target.capacity || target.seats || 0) + Number(selected.capacity || selected.seats || 0), mergedTableIds: [...(target.mergedTableIds || []), selected.id], orderId: selectedOrder?.id || target.orderId || null, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "tables", selected.id), { status: "Available", orderId: null, mergedInto: target.id, updatedAt: serverTimestamp() });
      alert("Tables merged successfully.");
      setTargetId("");
    } catch (error) { console.error("Merge failed:", error); alert(error?.message || "Unable to merge tables."); }
    finally { setSaving(false); }
  };

  const split = async () => {
    if (!selected) return;
    if (selectedOrder || selected.status === "Occupied") return alert("Move/settle the active order before physically splitting this table.");
    const capacity = Number(selected.capacity || selected.seats || 0);
    if (capacity < 2) return alert("Table capacity must be at least 2 to split.");
    const newName = window.prompt("New split table name", `${selected.name || selected.id}-B`);
    if (!newName) return;
    const first = Math.ceil(capacity / 2), second = capacity - first;
    try {
      setSaving(true);
      const id = `table-${Date.now()}`;
      await setDoc(doc(db, "tables", id), { id, name: newName.trim(), capacity: second, seats: second, section: selected.section || "Main Hall", status: "Available", branchId: selected.branchId || branchId || "all", splitFrom: selected.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "tables", selected.id), { capacity: first, seats: first, updatedAt: serverTimestamp() });
      alert("Table split successfully.");
    } catch (error) { console.error("Split failed:", error); alert(error?.message || "Unable to split table."); }
    finally { setSaving(false); }
  };

  const combineBills = async () => {
    if (!selected || !selectedOrder || !targetId) return alert("Select a target table first.");
    const target = tableList.find(t => t.id === targetId);
    if (!target || target.id === selected.id) return alert("Choose a different target table.");
    const targetOrder = activeOrders.find(o => String(o.table || o.tableNumber || o.tableId) === String(target.id));
    if (!targetOrder) return alert("Target table has no active bill to combine.");
    try {
      setSaving(true);
      const id = `COMBINED-${Date.now()}`;
      const combinedItems = [...(targetOrder.items || []), ...(selectedOrder.items || [])];
      await setDoc(doc(db, "combinedBills", id), { id, branchId: branchId || "all", tableIds: [target.id, selected.id], orderIds: [targetOrder.id, selectedOrder.id], items: combinedItems, subtotal: subtotal(combinedItems), status: "Open", createdBy: currentStaff?.uid || currentStaff?.id || "unknown", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "orders", selectedOrder.id), { combinedBillId: id, table: target.id, tableId: target.id, tableNumber: target.name || target.id, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "orders", targetOrder.id), { combinedBillId: id, combinedOrderIds: [targetOrder.id, selectedOrder.id], updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "tables", selected.id), { status: "Available", orderId: null, combinedInto: target.id, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "tables", target.id), { status: "Occupied", orderId: targetOrder.id, combinedBillId: id, combinedTableIds: [target.id, selected.id], updatedAt: serverTimestamp() });
      alert("Combined bill created and both orders are linked.");
      setTargetId("");
    } catch (error) { console.error("Combine bills failed:", error); alert(error?.message || "Unable to combine bills."); }
    finally { setSaving(false); }
  };

  const closeTable = async () => {
    if (!selected) return;
    if (selectedOrder && Number(selectedOrder.due || selectedOrder.balance || 0) > 0) return alert("Cannot close this table while an unpaid bill exists.");
    if (!window.confirm("Close this table and mark it Available?")) return;
    await persist(selected.id, { status: "Available", orderId: null, customerId: null, reservationId: null, closedAt: serverTimestamp() }, "Table closed and marked Available.");
  };

  const reservationConnect = async () => {
    if (!selected || !reservationId) return alert("Enter a reservation ID to connect.");
    try {
      setSaving(true);
      await updateDoc(doc(db, "tables", selected.id), { reservationId, status: "Reserved", updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "reservations", reservationId), { tableId: selected.id, table: selected.name || selected.id, updatedAt: serverTimestamp() });
      alert("Reservation connected to table.");
    } catch (error) { console.error("Reservation connection failed:", error); alert(error?.message || "Unable to connect reservation."); }
    finally { setSaving(false); }
  };

  const tableStats = {
    total: visibleTables.length,
    available: visibleTables.filter(t => (t.status || "Available") === "Available").length,
    occupied: visibleTables.filter(t => (t.status || "Available") === "Occupied").length,
    reserved: visibleTables.filter(t => (t.status || "Available") === "Reserved").length,
    cleaning: visibleTables.filter(t => (t.status || "Available") === "Cleaning").length
  };

  const statusMeta = {
    Available: { dot: "#3b8d57", bg: "#edf8f0", text: "#287345", border: "#bfe4c9" },
    Occupied: { dot: "#ff6b4a", bg: "#fff1ed", text: "#d94f34", border: "#ffc7bb" },
    Reserved: { dot: "#8b63c7", bg: "#f5effc", text: "#7043a9", border: "#dcc9f0" },
    Cleaning: { dot: "#c8941f", bg: "#fff8e8", text: "#9a7115", border: "#f0d99a" }
  };

  const getStatusStyle = status => statusMeta[status] || statusMeta.Available;

  return <div style={{display:"flex",flexDirection:"column",gap:18,minWidth:0}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:10}}>
      {[
        ["Total Tables", tableStats.total, "#4c1504"],
        ["Available", tableStats.available, "#287345"],
        ["Occupied", tableStats.occupied, "#d94f34"],
        ["Reserved", tableStats.reserved, "#7043a9"],
        ["Cleaning", tableStats.cleaning, "#9a7115"]
      ].map(([label,value,text])=><div key={label} style={{background:"#fff",border:"1px solid rgba(76,21,4,.07)",borderRadius:15,padding:"12px 14px",boxShadow:"0 5px 18px rgba(76,21,4,.035)"}}><div style={{fontSize:10,fontWeight:750,color:"#8b7770",textTransform:"uppercase",letterSpacing:".05em"}}>{label}</div><div style={{fontSize:22,fontWeight:850,color:text,marginTop:5}}>{value}</div></div>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 310px",gap:18,alignItems:"start"}}>
      <div style={{minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:12,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:14,fontWeight:850,color:INK}}>Floor Plan</div>
            <div style={{fontSize:11,color:"#8b7770",marginTop:3}}>Select a table to manage orders, reservations and table status.</div>
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{sections.map(s=><button key={s} type="button" onClick={()=>setSectionFilter(s)} style={{padding:"7px 12px",borderRadius:999,border:sectionFilter===s?"1px solid #ff6b4a":"1px solid rgba(76,21,4,.10)",background:sectionFilter===s?"#ff6b4a":"#fff",color:sectionFilter===s?"#fff":INK,fontSize:11,fontWeight:800,cursor:"pointer",boxShadow:sectionFilter===s?"0 4px 12px rgba(255,107,74,.18)":"none"}}>{s}</button>)}</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:12}}>
          {visibleTables.map(item=>{
            const order=activeOrders.find(o=>String(o.table||o.tableNumber||o.tableId)===String(item.id));
            const status=item.status||"Available";
            const meta=getStatusStyle(status);
            const isSelected=openId===item.id;
            return <button key={item.id} type="button" onClick={()=>setOpenId(item.id)} style={{minHeight:154,background:isSelected?"#fff9f6":"#fff",border:`1.5px solid ${isSelected?"#ff6b4a":meta.border}`,borderRadius:16,padding:14,cursor:"pointer",textAlign:"left",boxShadow:isSelected?"0 9px 24px rgba(255,107,74,.14)":"0 6px 18px rgba(76,21,4,.045)",transition:"transform .15s ease, box-shadow .15s ease, border-color .15s ease",display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}><div style={{fontWeight:850,color:INK,fontSize:15,lineHeight:1.2,overflowWrap:"anywhere"}}>{item.name||item.id}</div><span style={{width:8,height:8,borderRadius:"50%",background:meta.dot,marginTop:4,flex:"0 0 auto"}}/></div>
              <div style={{display:"inline-flex",alignSelf:"flex-start",alignItems:"center",gap:5,marginTop:10,padding:"5px 8px",borderRadius:999,background:meta.bg,color:meta.text,border:`1px solid ${meta.border}`,fontSize:10,fontWeight:850}}>{status}</div>
              <div style={{fontSize:11,color:"#85736c",marginTop:10,lineHeight:1.55}}><div>{item.capacity||item.seats||0} seats</div><div>{item.section||"Main Hall"}</div></div>
              <div style={{marginTop:"auto",paddingTop:8}}>
                {order&&<div style={{fontSize:10,color:INK,fontWeight:750,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Order: {order.orderNumber||order.id}</div>}
                {item.reservationId&&<div style={{fontSize:10,color:"#7043a9",fontWeight:750,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:3}}>Reservation linked</div>}
              </div>
            </button>;
          })}
        </div>
        {!visibleTables.length&&<div style={{padding:38,textAlign:"center",background:"#fff",border:"1px dashed rgba(76,21,4,.12)",borderRadius:16,color:"#89766e",fontSize:12}}>No tables in this section.</div>}
      </div>

      <div style={{background:"#fff",border:"1px solid rgba(76,21,4,.08)",borderRadius:18,padding:18,boxShadow:"0 7px 22px rgba(76,21,4,.045)",height:"fit-content",position:"sticky",top:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><div style={{width:34,height:34,borderRadius:10,background:"#fff0eb",display:"grid",placeItems:"center",color:"#ff6b4a",fontWeight:900}}>+</div><div><h3 style={{margin:0,color:INK,fontSize:16}}>Add Table</h3><div style={{fontSize:10,color:"#8b7770",marginTop:2}}>Floor plan setup</div></div></div>
        <div style={{display:"grid",gap:10,marginTop:15}}>
          <label style={{fontSize:10,fontWeight:800,color:"#806c64"}}>TABLE NAME<input placeholder="e.g. Table 7" value={floorForm.name} onChange={e=>setFloorForm({...floorForm,name:e.target.value})} style={{marginTop:5,width:"100%"}}/></label>
          <label style={{fontSize:10,fontWeight:800,color:"#806c64"}}>CAPACITY<input type="number" min="1" placeholder="Seats" value={floorForm.capacity} onChange={e=>setFloorForm({...floorForm,capacity:e.target.value})} style={{marginTop:5,width:"100%"}}/></label>
          <label style={{fontSize:10,fontWeight:800,color:"#806c64"}}>SECTION<input placeholder="Main Hall" value={floorForm.section} onChange={e=>setFloorForm({...floorForm,section:e.target.value})} style={{marginTop:5,width:"100%"}}/></label>
          <button type="button" disabled={saving} onClick={addTable} style={{...btnBrass,width:"100%",marginTop:2,opacity:saving?.7:1}}>{saving?"Saving…":"+ Add Table"}</button>
        </div>
        <div style={{fontSize:11,color:"#89766e",lineHeight:1.55,marginTop:12,paddingTop:12,borderTop:"1px solid rgba(76,21,4,.07)"}}>Tables are synced with Firestore in real time. Select any table card to open its controls.</div>
      </div>
    </div>

    {selected&&<div className="modal-backdrop" onClick={()=>setOpenId(null)}><div className="modal-card" onClick={e=>e.stopPropagation()}><div className="modal-header"><div><h2>{selected.name||selected.id}</h2><StatusBadge status={selected.status||"Available"}/></div><button className="modal-close" onClick={()=>setOpenId(null)}><X size={17}/></button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginBottom:16}}><div><b>Capacity</b><div>{selected.capacity||selected.seats||0} guests</div></div><div><b>Section</b><div>{selected.section||"Main Hall"}</div></div><div><b>Customer</b><div>{selectedOrder?.customer||selectedOrder?.customerName||selected.customerName||"Walk-in / none"}</div></div><div><b>Current Order</b><div>{selectedOrder?.orderNumber||selectedOrder?.id||"No active order"}</div></div><div><b>Table Timer</b><div>{selected.occupiedAt?new Date(selected.occupiedAt?.toDate?.()||selected.occupiedAt).toLocaleString():"Not started"}</div></div><div><b>Reservation</b><div>{selectedReservation?.id || selected.reservationId || "Not connected"}</div></div></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>{["Available","Occupied","Reserved","Cleaning"].map(s=><button key={s} type="button" disabled={saving} onClick={()=>setStatus(s)} style={{padding:"8px 11px",borderRadius:9,border:"1px solid rgba(76,21,4,.1)",cursor:"pointer",background:"#fff0eb",color:INK}}>{s}</button>)}<button type="button" disabled={saving} onClick={closeTable} style={{padding:"8px 11px",borderRadius:9,border:0,background:BRASS,color:"white",cursor:"pointer"}}>Close Table</button></div>
      {selectedOrder&&<div style={{borderTop:`1px solid ${LINE}`,paddingTop:14,marginTop:10}}><b>Connected Order → KOT → Bill</b><div style={{fontSize:12,color:"#89766e",margin:"6px 0 12px"}}>Order {selectedOrder.orderNumber||selectedOrder.id} remains linked to this table until the bill is settled.</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><select value={targetId} onChange={e=>setTargetId(e.target.value)}><option value="">Select target table</option>{tableList.filter(t=>t.id!==selected.id).map(t=><option key={t.id} value={t.id}>{t.name||t.id}</option>)}</select><button type="button" disabled={saving} onClick={transfer} style={{...btnBrass}}>Transfer / Move Order</button><button type="button" disabled={saving} onClick={merge} style={{...btnBrass}}>Merge Tables</button><button type="button" disabled={saving} onClick={combineBills} style={{...btnBrass}}>Combine Bills</button></div></div>}
      {!selectedOrder&&<div style={{borderTop:`1px solid ${LINE}`,paddingTop:14,marginTop:10}}><b>Table Operations</b><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}><select value={targetId} onChange={e=>setTargetId(e.target.value)}><option value="">Select target table</option>{tableList.filter(t=>t.id!==selected.id).map(t=><option key={t.id} value={t.id}>{t.name||t.id}</option>)}</select><button type="button" disabled={saving} onClick={merge} style={{...btnBrass}}>Merge Tables</button><button type="button" disabled={saving} onClick={split} style={{...btnBrass}}>Split Table</button></div></div>}
      <div style={{borderTop:`1px solid ${LINE}`,paddingTop:14,marginTop:14}}><b>Reservation Connection</b><div style={{display:"flex",gap:8,marginTop:9}}><input placeholder="Reservation ID" value={reservationId} onChange={e=>setReservationId(e.target.value)}/><button type="button" disabled={saving} onClick={reservationConnect} style={{...btnBrass}}>Connect</button></div></div>
      <div style={{borderTop:`1px solid ${LINE}`,paddingTop:14,marginTop:14}}><b>Current Order Items</b>{selectedOrder?.items?.length?<>{selectedOrder.items.map((item,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:13}}><span>{item.qty} × {item.name}</span><span>{moneyLocal(Number(item.qty||0)*Number(item.price||0))}</span></div>)}<div style={{display:"flex",justifyContent:"space-between",fontWeight:800,paddingTop:9,borderTop:`1px solid ${LINE}`}}><span>Subtotal</span><span>{moneyLocal(subtotal(selectedOrder.items))}</span></div></>:<div style={{color:"#89766e",fontSize:13,marginTop:7}}>No active order items.</div>}</div>
    </div></div>}
  </div>;
}

/* =========================================================
   ORDERS
   ========================================================= */

/* =========================================================
   RESERVATIONS — CALENDAR + GUEST / TABLE MANAGEMENT
   ========================================================= */

function AdminReservations({ currentStaff, branchId = "all" }) {
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState("");
  const [form, setForm] = useState({
    customer: "",
    phone: "",
    date: dateKey(today),
    time: "19:00",
    guests: 2,
    branchId: branchId !== "all" ? branchId : "",
    tableId: "",
    status: "Confirmed"
  });

  const role = String(currentStaff?.role || "");
  const canChooseAnyBranch = ["Super Admin", "Owner", "Head Office Admin", "Administrator"].includes(role);

  useEffect(() => {
    if (branchId !== "all") {
      setForm(current => ({ ...current, branchId }));
    } else if (!form.branchId && branches.length) {
      setForm(current => ({ ...current, branchId: branches[0].id }));
    }
  }, [branchId, branches.length]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "reservations"),
      snap => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setReservations(rows);
        setLoading(false);
      },
      error => {
        console.error("Reservations listener error:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "tables"),
      snap => {
        setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      error => console.error("Reservation tables listener error:", error)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "branches"),
      snap => {
        const rows = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(b => b.active !== false);
        setBranches(rows);
      },
      error => console.error("Reservation branches listener error:", error)
    );
    return () => unsub();
  }, []);

  const branchOptions = branches.length ? branches : [
    { id: "branch-01", name: "Branch 01", code: "Branch 01", active: true },
    { id: "branch-02", name: "Branch 02", code: "Branch 02", active: true },
    { id: "branch-03", name: "Branch 03", code: "Branch 03", active: true }
  ];

  const scopedReservations = useMemo(() => {
    return reservations
      .filter(r => branchId === "all" ? true : String(r.branchId || "") === String(branchId))
      .sort((a, b) => {
        const aa = `${a.date || ""} ${a.time || ""}`;
        const bb = `${b.date || ""} ${b.time || ""}`;
        return aa.localeCompare(bb);
      });
  }, [reservations, branchId]);

  const scopedTables = useMemo(() => {
    const selectedBranch = form.branchId || branchId;
    return tables.filter(t => selectedBranch === "all" || !selectedBranch || String(t.branchId || "") === String(selectedBranch));
  }, [tables, form.branchId, branchId]);

  const selectedDayReservations = scopedReservations.filter(r => r.date === selectedDate);

  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const firstWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const calendarCells = [];
  for (let i = 0; i < firstWeekday; i += 1) calendarCells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarCells.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
  }
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const dateKeyLocal = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const reservationCountForDate = key =>
    scopedReservations.filter(r => r.date === key && !["Cancelled", "No-show"].includes(r.status)).length;

  const statusStyle = {
    Confirmed: { bg: "#fff0eb", color: "#d94f34", dot: "#ff6b4a" },
    Seated: { bg: "#edf8f0", color: "#287345", dot: "#3b8d57" },
    Completed: { bg: "#eef1f4", color: "#68727a", dot: "#68727a" },
    Cancelled: { bg: "#fceeee", color: "#b73d3d", dot: "#c84632" },
    "No-show": { bg: "#fff7e7", color: "#9a7115", dot: "#c8941f" }
  };

  const updateForm = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const chooseDate = key => {
    setSelectedDate(key);
    setForm(current => ({ ...current, date: key }));
    const [y, m] = key.split("-").map(Number);
    if (y && m) setCalendarMonth(new Date(y, m - 1, 1));
  };

  const saveReservation = async event => {
    event?.preventDefault?.();

    const customerName = String(form.customer || "").trim();
    const phone = String(form.phone || "").trim();
    const date = String(form.date || "").trim();
    const time = String(form.time || "").trim();
    const guests = Math.max(1, Number(form.guests) || 0);
    const reservationBranch = form.branchId || (branchId !== "all" ? branchId : "");

    if (!customerName) return window.alert("Customer name is required.");
    if (!phone) return window.alert("Phone number is required.");
    if (!date) return window.alert("Reservation date is required.");
    if (!time) return window.alert("Reservation time is required.");
    if (!guests) return window.alert("Guests must be at least 1.");
    if (!reservationBranch || reservationBranch === "all") return window.alert("Select a branch.");

    const selectedTable = scopedTables.find(t => t.id === form.tableId);
    if (selectedTable && ["Occupied", "Cleaning"].includes(String(selectedTable.status || "Available"))) {
      return window.alert("Selected table is currently unavailable. Choose an Available or Reserved table.");
    }
    if (selectedTable && selectedTable.reservationId) {
      const linkedReservation = scopedReservations.find(r => String(r.id) === String(selectedTable.reservationId));
      if (linkedReservation && !["Cancelled", "Completed", "No-show"].includes(linkedReservation.status)) {
        return window.alert("Selected table already has an active reservation.");
      }
    }

    if (selectedTable && guests > Number(selectedTable.capacity || selectedTable.seats || 0)) {
      return window.alert(`Selected table can seat up to ${selectedTable.capacity || selectedTable.seats || 0} guests.`);
    }

    const conflicting = scopedReservations.find(r =>
      r.date === date &&
      r.time === time &&
      r.tableId &&
      form.tableId &&
      String(r.tableId) === String(form.tableId) &&
      !["Cancelled", "Completed", "No-show"].includes(r.status)
    );
    if (conflicting) return window.alert("This table already has an active reservation at this date and time.");

    setSaving(true);
    try {
      const id = `RES-${Date.now()}`;
      const reservation = {
        id,
        customer: customerName,
        phone,
        date,
        time,
        guests,
        branchId: reservationBranch,
        tableId: form.tableId || "",
        table: selectedTable?.name || form.tableId || "",
        status: form.status || "Confirmed",
        source: "Admin",
        createdBy: currentStaff?.uid || currentStaff?.id || "unknown",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "reservations", id), reservation);

      if (form.tableId) {
        const tableRef = doc(db, "tables", form.tableId);
        if (reservation.status === "Confirmed") {
          await updateDoc(tableRef, {
            status: "Reserved",
            reservationId: id,
            reservationCustomer: customerName,
            reservationDate: date,
            reservationTime: time,
            updatedAt: serverTimestamp()
          });
        } else if (reservation.status === "Seated") {
          await updateDoc(tableRef, {
            status: "Occupied",
            reservationId: id,
            reservationCustomer: customerName,
            occupiedAt: serverTimestamp(),
            reservationDate: date,
            reservationTime: time,
            updatedAt: serverTimestamp()
          });
        } else if (["Completed", "Cancelled", "No-show"].includes(reservation.status)) {
          await updateDoc(tableRef, {
            status: "Available",
            reservationId: null,
            reservationCustomer: null,
            reservationDate: null,
            reservationTime: null,
            updatedAt: serverTimestamp()
          });
        }
      }

      await setDoc(doc(collection(db, "auditLogs")), {
        userId: currentStaff?.uid || currentStaff?.id || "unknown",
        user: currentStaff?.name || currentStaff?.email || "Unknown user",
        action: "RESERVATION_CREATED",
        module: "Reservations",
        reservationId: id,
        branchId: reservationBranch,
        details: `${customerName} · ${date} ${time} · ${guests} guests`,
        date: dateKey(),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        createdAt: serverTimestamp()
      });

      setSelectedDate(date);
      setForm(current => ({
        ...current,
        customer: "",
        phone: "",
        date,
        time: "19:00",
        guests: 2,
        tableId: "",
        status: "Confirmed"
      }));
      window.alert(`Reservation ${id} created successfully.`);
    } catch (error) {
      console.error("Create reservation failed:", error);
      window.alert(error?.message || "Unable to create reservation. Check Firestore Rules and try again.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (reservation, nextStatus) => {
    if (!reservation?.id) return;

    const table = reservation.tableId ? tables.find(t => t.id === reservation.tableId) : null;

    if (nextStatus === "Seated" && reservation.tableId) {
      if (table && String(table.reservationId || "") && String(table.reservationId) !== String(reservation.id)) {
        return window.alert("This table is reserved for another booking.");
      }
      if (table && String(table.status || "") === "Occupied" && String(table.reservationId || "") !== String(reservation.id)) {
        return window.alert("This table is currently occupied. Choose another table or move the current order first.");
      }
    }

    if (nextStatus === "Confirmed" && reservation.tableId && table?.reservationId && String(table.reservationId) !== String(reservation.id)) {
      return window.alert("This table is already reserved for another booking.");
    }

    setStatusSaving(reservation.id);
    try {
      await updateDoc(doc(db, "reservations", reservation.id), {
        status: nextStatus,
        seatedAt: nextStatus === "Seated" ? serverTimestamp() : reservation.seatedAt || null,
        completedAt: nextStatus === "Completed" ? serverTimestamp() : reservation.completedAt || null,
        cancelledAt: nextStatus === "Cancelled" ? serverTimestamp() : reservation.cancelledAt || null,
        noShowAt: nextStatus === "No-show" ? serverTimestamp() : reservation.noShowAt || null,
        updatedAt: serverTimestamp(),
        updatedBy: currentStaff?.uid || currentStaff?.id || "unknown"
      });

      if (reservation.tableId) {
        const tableRef = doc(db, "tables", reservation.tableId);
        if (nextStatus === "Confirmed") {
          await updateDoc(tableRef, {
            status: "Reserved",
            reservationId: reservation.id,
            reservationCustomer: reservation.customer || "",
            reservationDate: reservation.date || "",
            reservationTime: reservation.time || "",
            updatedAt: serverTimestamp()
          });
        } else if (nextStatus === "Seated") {
          await updateDoc(tableRef, {
            status: "Occupied",
            reservationId: reservation.id,
            reservationCustomer: reservation.customer || "",
            occupiedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else if (["Completed", "Cancelled", "No-show"].includes(nextStatus)) {
          if (table?.reservationId && String(table.reservationId) === String(reservation.id) && !table?.orderId) {
            await updateDoc(tableRef, {
              status: "Available",
              reservationId: null,
              reservationCustomer: null,
              reservationDate: null,
              reservationTime: null,
              occupiedAt: null,
              updatedAt: serverTimestamp()
            });
          }
        }
      }

      await setDoc(doc(collection(db, "auditLogs")), {
        userId: currentStaff?.uid || currentStaff?.id || "unknown",
        user: currentStaff?.name || currentStaff?.email || "Unknown user",
        action: `RESERVATION_${nextStatus.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
        module: "Reservations",
        reservationId: reservation.id,
        branchId: reservation.branchId || branchId || "all",
        oldValue: reservation.status || "Confirmed",
        newValue: nextStatus,
        details: `${reservation.customer || "Customer"} · ${reservation.date || ""} ${reservation.time || ""}`,
        date: dateKey(),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Reservation status update failed:", error);
      window.alert(error?.message || "Unable to update reservation status.");
    } finally {
      setStatusSaving("");
    }
  };

  const openCreateForDate = () => {
    setForm(current => ({ ...current, date: selectedDate }));
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
        {[
          ["Today", scopedReservations.filter(r => r.date === dateKey(today) && !["Cancelled", "No-show"].includes(r.status)).length, "#4C1504"],
          ["Confirmed", scopedReservations.filter(r => r.status === "Confirmed").length, "#d94f34"],
          ["Seated", scopedReservations.filter(r => r.status === "Seated").length, "#287345"],
          ["Pending / No-show", scopedReservations.filter(r => ["Confirmed", "No-show"].includes(r.status)).length, "#9a7115"]
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid rgba(76,21,4,.07)", borderRadius: 15, padding: "13px 15px", boxShadow: "0 5px 18px rgba(76,21,4,.035)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#8b7770", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 850, color, marginTop: 5 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(320px,.65fr)", gap: 18, alignItems: "start" }}>
        <section style={{ background: "#fff", border: "1px solid rgba(76,21,4,.08)", borderRadius: 18, padding: 18, boxShadow: "0 7px 22px rgba(76,21,4,.045)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "#fff0eb", color: BRASS, display: "grid", placeItems: "center" }}><CalendarDays size={19} /></div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 850, color: INK }}>Reservation Calendar</div>
                <div style={{ fontSize: 11, color: "#8b7770", marginTop: 2 }}>Select a date to view and manage reservations.</div>
              </div>
            </div>
            <button type="button" onClick={openCreateForDate} style={btnBrass}>+ New Reservation</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} style={{ border: "1px solid rgba(76,21,4,.10)", background: "#fff", borderRadius: 9, width: 36, height: 36, cursor: "pointer", color: INK }}>‹</button>
            <strong style={{ color: INK, fontSize: 16 }}>
              {calendarMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </strong>
            <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} style={{ border: "1px solid rgba(76,21,4,.10)", background: "#fff", borderRadius: 9, width: 36, height: 36, cursor: "pointer", color: INK }}>›</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 5, marginBottom: 5 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: "#8b7770", padding: "6px 0" }}>{day}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 5 }}>
            {calendarCells.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} style={{ minHeight: 62 }} />;
              const key = dateKeyLocal(day);
              const count = reservationCountForDate(key);
              const selected = selectedDate === key;
              const isToday = dateKey(today) === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => chooseDate(key)}
                  style={{
                    minHeight: 62,
                    border: `1px solid ${selected ? BRASS : isToday ? "rgba(255,107,74,.45)" : "rgba(76,21,4,.08)"}`,
                    background: selected ? "#fff0eb" : "#fff",
                    borderRadius: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 8,
                    color: INK
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5 }}>
                    <strong style={{ fontSize: 12 }}>{day.getDate()}</strong>
                    {isToday && <span style={{ fontSize: 8, color: BRASS, fontWeight: 900 }}>TODAY</span>}
                  </div>
                  {count > 0 && <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 6px", borderRadius: 999, background: "#ff6b4a", color: "#fff", fontSize: 9, fontWeight: 850 }}>{count} {count === 1 ? "booking" : "bookings"}</div>}
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ background: "#fff", border: "1px solid rgba(76,21,4,.08)", borderRadius: 18, padding: 18, boxShadow: "0 7px 22px rgba(76,21,4,.045)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "#fff0eb", color: BRASS, display: "grid", placeItems: "center" }}><UsersRound size={19} /></div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 850, color: INK }}>New Reservation</div>
              <div style={{ fontSize: 11, color: "#8b7770", marginTop: 2 }}>Create a booking without a customer account.</div>
            </div>
          </div>

          <form onSubmit={saveReservation} style={{ display: "grid", gap: 10 }}>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#806c64" }}>CUSTOMER
              <input value={form.customer} onChange={e => updateForm("customer", e.target.value)} placeholder="Customer name" style={{ marginTop: 5, width: "100%" }} />
            </label>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#806c64" }}>PHONE
              <input type="tel" value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="Phone number" style={{ marginTop: 5, width: "100%" }} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <label style={{ fontSize: 10, fontWeight: 800, color: "#806c64" }}>DATE
                <input type="date" value={form.date} onChange={e => { updateForm("date", e.target.value); chooseDate(e.target.value); }} style={{ marginTop: 5, width: "100%" }} />
              </label>
              <label style={{ fontSize: 10, fontWeight: 800, color: "#806c64" }}>TIME
                <input type="time" value={form.time} onChange={e => updateForm("time", e.target.value)} style={{ marginTop: 5, width: "100%" }} />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <label style={{ fontSize: 10, fontWeight: 800, color: "#806c64" }}>GUESTS
                <input type="number" min="1" value={form.guests} onChange={e => updateForm("guests", e.target.value)} style={{ marginTop: 5, width: "100%" }} />
              </label>
              <label style={{ fontSize: 10, fontWeight: 800, color: "#806c64" }}>STATUS
                <select value={form.status} onChange={e => updateForm("status", e.target.value)} style={{ marginTop: 5, width: "100%" }}>
                  {["Confirmed", "Seated", "Completed", "Cancelled", "No-show"].map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#806c64" }}>BRANCH
              <select value={form.branchId} disabled={!canChooseAnyBranch && branchId !== "all"} onChange={e => updateForm("branchId", e.target.value)} style={{ marginTop: 5, width: "100%", opacity: (!canChooseAnyBranch && branchId !== "all") ? .65 : 1 }}>
                <option value="">Select branch</option>
                {branchOptions.map(b => <option key={b.id} value={b.id}>{b.code || b.name || b.id}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 10, fontWeight: 800, color: "#806c64" }}>TABLE
              <select value={form.tableId} onChange={e => updateForm("tableId", e.target.value)} style={{ marginTop: 5, width: "100%" }}>
                <option value="">Unassigned table</option>
                {scopedTables.map(t => (
                  <option key={t.id} value={t.id} disabled={["Occupied", "Cleaning"].includes(t.status)}>
                    {t.name || t.id} · {t.capacity || t.seats || 0} seats · {t.status || "Available"}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={saving} style={{ ...btnBrass, width: "100%", opacity: saving ? .7 : 1 }}>
              {saving ? "Saving…" : "Create Reservation"}
            </button>
          </form>
        </section>
      </div>

      <section style={{ background: "#fff", border: "1px solid rgba(76,21,4,.08)", borderRadius: 18, padding: 18, boxShadow: "0 7px 22px rgba(76,21,4,.045)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 13 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 850, color: INK }}>Reservations for {selectedDate}</div>
            <div style={{ fontSize: 11, color: "#8b7770", marginTop: 2 }}>{selectedDayReservations.length} reservation{selectedDayReservations.length === 1 ? "" : "s"} · realtime Firestore</div>
          </div>
          <button type="button" onClick={() => setSelectedDate(dateKey(today))} style={{ ...btnBrass, background: "#fff", color: INK, border: "1px solid rgba(76,21,4,.10)" }}>Today</button>
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: "#89766e" }}>Loading reservations…</div>
        ) : !selectedDayReservations.length ? (
          <div style={{ padding: 30, textAlign: "center", background: "#fffaf7", border: "1px dashed rgba(76,21,4,.12)", borderRadius: 14, color: "#89766e" }}>No reservations for this date.</div>
        ) : (
          <div style={{ display: "grid", gap: 9 }}>
            {selectedDayReservations.map(r => {
              const meta = statusStyle[r.status] || statusStyle.Confirmed;
              const branchName = branchOptions.find(b => b.id === r.branchId)?.name || branchOptions.find(b => b.id === r.branchId)?.code || r.branchId || "Branch";
              return (
                <div key={r.id} style={{ border: "1px solid rgba(76,21,4,.08)", borderRadius: 14, padding: 13, display: "grid", gridTemplateColumns: "minmax(180px,1.3fr) repeat(4,minmax(90px,.7fr)) minmax(220px,1.1fr)", gap: 10, alignItems: "center" }}>
                  <div>
                    <strong style={{ color: INK, fontSize: 13 }}>{r.customer || "Customer"}</strong>
                    <div style={{ color: "#89766e", fontSize: 11, marginTop: 3 }}>{r.phone || "No phone"} · {r.id}</div>
                  </div>
                  <div><small style={{ color: "#8b7770" }}>TIME</small><div style={{ color: INK, fontWeight: 750, marginTop: 3 }}><Clock3 size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{r.time || "—"}</div></div>
                  <div><small style={{ color: "#8b7770" }}>GUESTS</small><div style={{ color: INK, fontWeight: 750, marginTop: 3 }}>{r.guests || 0}</div></div>
                  <div><small style={{ color: "#8b7770" }}>BRANCH</small><div style={{ color: INK, fontWeight: 750, marginTop: 3 }}>{branchName}</div></div>
                  <div><small style={{ color: "#8b7770" }}>TABLE</small><div style={{ color: INK, fontWeight: 750, marginTop: 3 }}>{r.table || r.tableId || "Unassigned"}</div></div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 8px", borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 850 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot }} />{r.status || "Confirmed"}</span>
                    <select value={r.status || "Confirmed"} disabled={statusSaving === r.id} onChange={e => changeStatus(r, e.target.value)} style={{ minHeight: 36, width: 120 }}>
                      {["Confirmed", "Seated", "Completed", "Cancelled", "No-show"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminOrders({ orders, setOrders }) {
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [liveOrders, setLiveOrders] = useState(() => Array.isArray(orders) ? orders : []);
  const [timeline, setTimeline] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [savingDetails, setSavingDetails] = useState(false);
  const [ordersSyncError, setOrdersSyncError] = useState("");
  const filters = ["All", "Pending", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled", "Delivery", "Dine-in", "Takeaway", "Pre-order", "QR Order", "Online"];
  const STATUS_FLOW = ["Pending", "Accepted", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"];

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        if (!mounted) return;
        const firebaseOrders = snapshot.docs
          .map((item) => ({
            ...item.data(),
            id: item.data()?.id || item.id,
            orderNumber: item.data()?.orderNumber || item.data()?.id || item.id,
            firestoreDocId: item.id
          }))
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime() || 0;
            const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime() || 0;
            return bTime - aTime;
          });
        setLiveOrders(firebaseOrders);
        setOrdersSyncError("");
        if (typeof setOrders === "function") setOrders(firebaseOrders);
      },
      (error) => {
        console.error("Firestore orders error:", error);
        if (mounted) setOrdersSyncError(error?.message || "Unable to read orders from Firebase.");
      }
    );
    return () => {
      mounted = false;
      try { unsubscribe(); } catch {}
    };
  }, [setOrders]);

  useEffect(() => {
    if (!selectedOrder?.id) { setTimeline([]); return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const [auditSnap, refundSnap, staffSnap] = await Promise.all([
          getDocs(query(collection(db, "auditLogs"), where("orderId", "==", selectedOrder.id))),
          getDocs(query(collection(db, "refunds"), where("orderId", "==", selectedOrder.id))),
          getDocs(collection(db, "staff"))
        ]);
        if (cancelled) return;
        const auditRows = auditSnap.docs.map(d => ({ id:d.id, ...d.data() }));
        const refundRows = refundSnap.docs.map(d => ({ id:d.id, ...d.data() }));
        setTimeline([
          ...(Array.isArray(selectedOrder.timeline) ? selectedOrder.timeline : []),
          ...(Array.isArray(selectedOrder.statusHistory) ? selectedOrder.statusHistory : []),
          ...auditRows.map(a => ({ status:a.action, details:a.details || a.module, date:a.date, time:a.time }))
        ].sort((a,b) => `${a.date||""} ${a.time||""}`.localeCompare(`${b.date||""} ${b.time||""}`)));
        setSelectedOrder(current => current ? { ...current, refundStatus: current.refundStatus || (refundRows.length ? refundRows[refundRows.length-1].status : "Not refunded") } : current);
        setStaffOptions(staffSnap.docs.map(d => ({ id:d.id, ...d.data() })));
      } catch (error) {
        console.error("Order detail data error:", error);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedOrder?.id]);

  const recordOrderAudit = async (order, action, oldValue, newValue, details = "") => {
    const auditRef = doc(collection(db, "auditLogs"));
    await setDoc(auditRef, {
      userId: "admin-orders",
      user: "Order Operations",
      action,
      module: "Orders",
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      orderId: order.id,
      orderNumber: order.orderNumber || order.id,
      branchId: order.branchId || "all",
      details,
      date: new Date().toISOString().slice(0,10),
      time: new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })
    });
  };

  const saveOrderChanges = async (id, changes, fallbackOrder) => {
    const exactRef = doc(db, "orders", id);
    try {
      await updateDoc(exactRef, { ...changes, updatedAt: serverTimestamp() });
      return;
    } catch (error) {
      if (error?.code !== "not-found") throw error;
    }
    const snapshot = await getDocs(query(collection(db, "orders"), where("id", "==", id)));
    if (snapshot.empty) {
      await setDoc(exactRef, { ...fallbackOrder, ...changes, id, updatedAt: serverTimestamp() }, { merge: true });
      return;
    }
    await Promise.all(snapshot.docs.map(item => updateDoc(item.ref, { ...changes, updatedAt: serverTimestamp() })));
  };

  const syncLocal = (id, changes) => {
    setLiveOrders(current => current.map(item => item.id === id ? { ...item, ...changes } : item));
    if (typeof setOrders === "function") setOrders(current => current.map(item => item.id === id ? { ...item, ...changes } : item));
    setSelectedOrder(current => current?.id === id ? { ...current, ...changes } : current);
  };

  const advance = async (id) => {
    const order = liveOrders.find(item => item.id === id);
    if (!order) return;
    const index = STATUS_FLOW.indexOf(order.status);
    const next = order.status === "New" ? "Accepted" : index >= 0 && index < STATUS_FLOW.length - 2 ? STATUS_FLOW[index + 1] : null;
    if (!next) return;
    const notification = next === "Out for Delivery" ? `Your order ${order.id} is out for delivery.` : next === "Delivered" ? `Your order ${order.id} has been delivered successfully.` : `Order ${order.id} is now ${next}.`;
    const history = [...(Array.isArray(order.statusHistory) ? order.statusHistory : []), { status: next, date: new Date().toISOString().slice(0,10), time: new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }) }];
    try {
      await saveOrderChanges(id, { status: next, notification, statusHistory: history }, order);
      await recordOrderAudit(order, "STATUS_CHANGE", order.status, next, `Order ${order.id}: ${order.status} → ${next}`);
      syncLocal(id, { status: next, notification, statusHistory: history });
    } catch (error) {
      console.error("Order status update failed:", error);
      window.alert(error?.message || "Unable to update order status in Firebase.");
    }
  };

  const cancel = async (id) => {
    const order = liveOrders.find(item => item.id === id);
    if (!order) return;
    const reason = window.prompt("Cancellation reason:", order.cancellationReason || "");
    if (reason === null) return;
    const cleanReason = reason.trim() || "Cancelled by staff";
    const notification = `Your order ${order.id} has been cancelled.`;
    try {
      await saveOrderChanges(id, { status:"Cancelled", cancellationReason:cleanReason, notification, cancelledAt:serverTimestamp() }, order);
      await recordOrderAudit(order, "ORDER_CANCELLED", order.status, "Cancelled", `Reason: ${cleanReason}`);
      syncLocal(id, { status:"Cancelled", cancellationReason:cleanReason, notification });
    } catch (error) {
      console.error("Order cancellation failed:", error);
      window.alert(error?.message || "Unable to update order cancellation in Firebase.");
    }
  };

  const saveDetails = async () => {
    if (!selectedOrder) return;
    setSavingDetails(true);
    const fields = {
      source: selectedOrder.source || "POS",
      channel: selectedOrder.channel || "admin",
      customerNotes: selectedOrder.customerNotes || "",
      kitchenNotes: selectedOrder.kitchenNotes || "",
      tableNumber: selectedOrder.tableNumber || selectedOrder.table || "",
      assignedWaiter: selectedOrder.assignedWaiter || "",
      assignedKitchenStation: selectedOrder.assignedKitchenStation || "Main Kitchen",
      assignedDeliveryPartner: selectedOrder.assignedDeliveryPartner || "",
      refundStatus: selectedOrder.refundStatus || "Not refunded"
    };
    try {
      const previous = liveOrders.find(o => o.id === selectedOrder.id) || {};
      await saveOrderChanges(selectedOrder.id, fields, previous);
      await recordOrderAudit(previous, "ORDER_DETAILS_UPDATE", { ...previous }, fields, "Order operational details updated");
      syncLocal(selectedOrder.id, fields);
      window.alert("Order details saved successfully.");
    } catch (error) {
      window.alert(error?.message || "Unable to save order details in Firebase.");
    } finally { setSavingDetails(false); }
  };

  const isOnline = order => order.type === "Online" || order.source === "Online" || order.source === "Website" || order.channel === "website" || order.channel === "online";
  const filtered = liveOrders.filter(order => {
    if (filter === "All") return true;
    if (filter === "Pending") return !["Delivered","Cancelled"].includes(order.status);
    if (["Delivery","Dine-in","Takeaway","Pre-order","QR Order"].includes(filter)) return order.type === filter;
    if (filter === "Online") return isOnline(order);
    return order.status === filter;
  });

  return (
    <div className="orders-admin-wrap">
      <div className="cms-hero-head">
        <div><span className="cms-kicker">ORDER OPERATIONS</span><h2>Orders</h2><p>See complete order information, source, payment, kitchen assignment, delivery assignment and timeline.</p></div>
        <div className="orders-total-pill"><ReceiptText size={15} /> {liveOrders.length} total orders</div>
      </div>
      <div className="order-filter-pills">{filters.map(item => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
      {ordersSyncError && (
        <div className="admin-section-error" style={{ marginBottom: 16 }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Orders are not syncing from Firebase</strong>
            <p style={{ margin: "4px 0 0" }}>{ordersSyncError}</p>
          </div>
        </div>
      )}
      <Panel>
        <div className="data-table-wrap">
          <table className="data-table order-admin-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Type / Source</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.firestoreDocId || order.id}>
                  <td><strong>{orderText(order.orderNumber || order.id, "Order")}</strong><div className="muted-cell">{orderText(order.time, "just now")}</div></td>
                  <td><strong>{orderText(order.customer, orderText(order.customerDetails?.name, "Guest"))}</strong><div className="muted-cell">{orderText(order.phone, orderText(order.customerDetails?.phone, "No phone"))}</div></td>
                  <td><div className="order-items-cell">{(Array.isArray(order.items) ? order.items : []).map((item,index) => <span key={index}>{orderText(item.qty, 0)}× {orderText(item.name, "Item")}</span>)}</div></td>
                  <td><strong>{money(order.total)}</strong><div className="muted-cell">Discount {money(order.discount)} · Tax {money(order.tax?.amount)}</div></td>
                  <td><strong>{orderText(order.type, "Online")}</strong><div className="muted-cell">Source: {orderText(order.source, orderText(order.channel, "Unknown"))}</div></td>
                  <td><strong>{orderText(order.paymentStatus, "Not recorded")}</strong><div className="muted-cell">{orderText(order.paymentMethod, "—")}</div></td>
                  <td><StatusBadge status={orderText(order.status, "Pending")} /></td>
                  <td><div className="order-actions-inline"><button className="details-button" onClick={() => setSelectedOrder(order)}>Details</button>{!['Delivered','Cancelled'].includes(order.status) && <button className="advance-button" onClick={() => advance(order.id)}>Advance</button>}{order.status !== "Cancelled" && <button className="icon-only-button danger" onClick={() => cancel(order.id)}><X size={14}/></button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="empty-state">No orders found for this filter.</div>}
        </div>
      </Panel>

      {selectedOrder && <div className="admin-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedOrder(null); }}>
        <div className="admin-modal-card order-detail-modal" style={{maxWidth:980,maxHeight:'90vh',overflowY:'auto'}}>
          <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}><X size={16}/></button>
          <span className="cms-kicker">COMPLETE ORDER DETAILS</span><h3>{selectedOrder.id}</h3>
          <div className="detail-grid">
            <div><span>Order type</span><strong>{orderText(selectedOrder.type, "Online")}</strong></div>
            <div><span>Order source</span><strong>{orderText(selectedOrder.source, orderText(selectedOrder.channel, "Unknown"))}</strong></div>
            <div><span>Status</span><strong>{orderText(selectedOrder.status, "Pending")}</strong></div>
            <div><span>Payment status</span><strong>{orderText(selectedOrder.paymentStatus, "Not recorded")}</strong></div>
            <div><span>Payment method</span><strong>{orderText(selectedOrder.paymentMethod, "—")}</strong></div>
            <div><span>Table number</span><strong>{orderText(selectedOrder.tableNumber, orderText(selectedOrder.table, "—"))}</strong></div>
            <div><span>Discount</span><strong>{money(selectedOrder.discount)}</strong></div>
            <div><span>Tax</span><strong>{money(selectedOrder.tax?.amount)}</strong></div>
            <div><span>Service charge</span><strong>{money(selectedOrder.serviceCharge)}</strong></div>
            <div><span>Refund status</span><strong>{selectedOrder.refundStatus || "Not refunded"}</strong></div>
          </div>
          <div className="order-detail-customer"><div className="delivery-customer-icon"><UserCircle2 size={18}/></div><div><strong>{orderText(selectedOrder.customer, orderText(selectedOrder.customerDetails?.name, "Guest"))}</strong><span>{orderText(selectedOrder.phone, orderText(selectedOrder.customerDetails?.phone, "—"))}</span><span>{orderText(selectedOrder.address, orderText(selectedOrder.customerDetails?.address, "—"))}</span></div></div>
          <div className="detail-items-list">{(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item,index) => <div key={index}><div><strong>{orderText(item.qty, 0)}× {orderText(item.name, "Item")}</strong><span>Unit price {money(item.price || 0)}{item.variant ? ` · Variant: ${orderText(item.variant)}` : ""}</span></div><strong>{money(Number(item.qty||0)*Number(item.price||0))}</strong></div>)}</div>
          <div className="order-detail-total"><span>Total</span><strong>{money(selectedOrder.total)}</strong></div>

          <div style={{marginTop:20}}><span className="cms-kicker">OPERATIONAL ASSIGNMENTS</span></div>
          <div className="detail-grid" style={{marginTop:10}}>
            <label><span>Assigned waiter</span><select value={selectedOrder.assignedWaiter || ""} onChange={e=>setSelectedOrder({...selectedOrder,assignedWaiter:e.target.value})}><option value="">Not assigned</option>{staffOptions.filter(s=>s.role === "Waiter" || !s.role).map(s=><option key={s.id} value={s.id}>{s.name || s.email || s.id}</option>)}</select></label>
            <label><span>Kitchen station</span><select value={selectedOrder.assignedKitchenStation || "Main Kitchen"} onChange={e=>setSelectedOrder({...selectedOrder,assignedKitchenStation:e.target.value})}><option>Main Kitchen</option><option>Grill</option><option>Beverage</option><option>Dessert</option><option>Packing</option></select></label>
            <label><span>Delivery partner</span><select value={selectedOrder.assignedDeliveryPartner || ""} onChange={e=>setSelectedOrder({...selectedOrder,assignedDeliveryPartner:e.target.value})}><option value="">Not assigned</option>{staffOptions.filter(s=>s.role === "Delivery Partner" || !s.role).map(s=><option key={s.id} value={s.id}>{s.name || s.email || s.id}</option>)}</select></label>
            <label><span>Table number</span><input value={selectedOrder.tableNumber || selectedOrder.table || ""} onChange={e=>setSelectedOrder({...selectedOrder,tableNumber:e.target.value})}/></label>
          </div>
          <div className="detail-grid" style={{marginTop:10}}>
            <label style={{gridColumn:'1 / -1'}}><span>Customer notes</span><textarea value={selectedOrder.customerNotes || ""} onChange={e=>setSelectedOrder({...selectedOrder,customerNotes:e.target.value})}/></label>
            <label style={{gridColumn:'1 / -1'}}><span>Kitchen notes</span><textarea value={selectedOrder.kitchenNotes || ""} onChange={e=>setSelectedOrder({...selectedOrder,kitchenNotes:e.target.value})}/></label>
            <label><span>Refund status</span><select value={selectedOrder.refundStatus || "Not refunded"} onChange={e=>setSelectedOrder({...selectedOrder,refundStatus:e.target.value})}><option>Not refunded</option><option>Requested</option><option>Partially refunded</option><option>Refunded</option><option>Rejected</option></select></label>
          </div>
          <div className="p0-actions" style={{marginTop:14}}><button className="advance-button" onClick={saveDetails} disabled={savingDetails}>{savingDetails ? "Saving…" : "Save Order Details"}</button></div>

          <div style={{marginTop:22}}><span className="cms-kicker">ORDER TIMELINE / AUDIT TRAIL</span><div style={{marginTop:10}}>{timeline.length ? timeline.map((t,i)=><div key={i} style={{padding:'9px 0',borderBottom:`1px solid ${LINE}`}}><strong>{t.status || t.action || "Order update"}</strong><div className="muted-cell">{t.date || ""} {t.time || ""} {t.details ? ` · ${t.details}` : ""}</div></div>) : <div className="muted-cell">No detailed timeline recorded yet. Future status/details changes will be added here.</div>}</div></div>
        </div>
      </div>}
    </div>
  );
}

/* =========================================================
   CUSTOMERS
   ========================================================= */

function AdminCustomers({
  orders
}) {
  const customerMap = {};

  orders.forEach(
    (order) => {
      if (!order.phone) {
        return;
      }

      if (
        !customerMap[
          order.phone
        ]
      ) {
        customerMap[
          order.phone
        ] = {
          name:
            order.customer,
          phone:
            order.phone,
          orders: 0,
          spend: 0
        };
      }

      customerMap[
        order.phone
      ].orders += 1;

      customerMap[
        order.phone
      ].spend +=
        Number(
          order.total || 0
        );
    }
  );

  const customers =
    Object.values(
      customerMap
    );

  return (
    <Panel
      title={`Customers (${customers.length})`}
    >
      {customers.length ===
        0 && (
        <div className="empty-state">
          Customers will appear
          after delivery or
          takeaway orders.
        </div>
      )}

      {customers.length >
        0 && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {[
                  "Name",
                  "Phone",
                  "Orders",
                  "Total Spend"
                ].map(
                  (heading) => (
                    <th
                      key={
                        heading
                      }
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {customers.map(
                (customer) => (
                  <tr
                    key={
                      customer.phone
                    }
                  >
                    <td>
                      {
                        customer.name
                      }
                    </td>

                    <td>
                      {
                        customer.phone
                      }
                    </td>

                    <td>
                      {
                        customer.orders
                      }
                    </td>

                    <td
                      style={{
                        color:
                          BRASS,
                        fontWeight:
                          800
                      }}
                    >
                      {money(
                        customer.spend
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* =========================================================
   OFFERS & BANNERS ADMIN
   ========================================================= */

function AdminOffers({
  offerBanners = [],
  setOfferBanners
}) {
  const emptyForm = {
    image: "",
    alt: "",
    title: "",
    subtitle: "",
    buttonText: "Explore Offer",
    enabled: true
  };

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");

  const ghostButton = {
    minHeight: 38,
    padding: "0 12px",
    border: "1px solid rgba(76,21,4,.11)",
    borderRadius: 9,
    background: "#fff",
    color: INK,
    fontSize: 10,
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ ...emptyForm });
  };

  const startAdd = () => {
    setNotice("");
    resetForm();
  };

  const startEdit = (banner) => {
    setEditing(banner.id);
    setForm({
      image: banner.image || "",
      alt: banner.alt || "Special offer",
      title: banner.title || "Special Offer",
      subtitle: banner.subtitle || "Freshly prepared for you.",
      buttonText: banner.buttonText || "Explore Offer",
      enabled: banner.enabled !== false
    });
    setNotice("");
  };

  const saveBanner = (event) => {
    event.preventDefault();

    const image = String(form.image || "").trim();
    if (!image || image === "Local uploaded image") {
      setNotice("Please add a banner image first.");
      return;
    }

    const payload = {
      image,
      alt: String(form.alt || "").trim() || "Special offer",
      title: String(form.title || "").trim() || "Special Offer",
      subtitle:
        String(form.subtitle || "").trim() ||
        "Freshly prepared for you.",
      buttonText:
        String(form.buttonText || "").trim() || "Explore Offer",
      enabled: form.enabled !== false
    };

    if (editing) {
      setOfferBanners((current) =>
        current.map((banner) =>
          banner.id === editing ? { ...banner, ...payload } : banner
        )
      );
      setNotice("Banner updated successfully.");
    } else {
      setOfferBanners((current) => [
        ...current,
        {
          id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ...payload
        }
      ]);
      setNotice("Banner added successfully.");
    }

    resetForm();
  };

  const readImageFile = (file) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("Please select image files only."));
        return;
      }

      // Keep individual uploads reasonably small because banners are stored
      // in browser storage by the parent app.
      if (file.size > 2.5 * 1024 * 1024) {
        reject(
          new Error(
            `${file.name} is larger than 2.5 MB. Please compress it and try again.`
          )
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });

  const uploadMultipleImages = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setUploading(true);
    setNotice("");

    try {
      const uploaded = [];
      for (const file of files) {
        try {
          const image = await readImageFile(file);
          uploaded.push({ file, image });
        } catch (error) {
          setNotice(error?.message || "One of the images could not be added.");
        }
      }

      if (uploaded.length) {
        const timestamp = Date.now();
        setOfferBanners((current) => [
          ...current,
          ...uploaded.map(({ file, image }, index) => ({
            id: `offer-${timestamp}-${index}-${Math.random().toString(36).slice(2, 7)}`,
            image,
            alt: file.name.replace(/\.[^.]+$/, "") || "Special offer",
            title: "Special Offer",
            subtitle: "Freshly prepared for you.",
            buttonText: "Explore Offer",
            enabled: true
          }))
        ]);
        setNotice(
          `${uploaded.length} banner${uploaded.length === 1 ? "" : "s"} added. You can keep adding more.`
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const image = String(form.image || "").trim();
    if (!image) {
      setNotice("Paste an image URL first.");
      return;
    }

    setOfferBanners((current) => [
      ...current,
      {
        id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        image,
        alt: String(form.alt || "").trim() || "Special offer",
        title: String(form.title || "").trim() || "Special Offer",
        subtitle:
          String(form.subtitle || "").trim() ||
          "Freshly prepared for you.",
        buttonText:
          String(form.buttonText || "").trim() || "Explore Offer",
        enabled: form.enabled !== false
      }
    ]);

    setNotice("Banner image added to the list.");
    resetForm();
  };

  const removeBanner = (id) => {
    if (!window.confirm("Delete this promotional banner?")) return;

    setOfferBanners((current) =>
      current.filter((banner) => banner.id !== id)
    );

    if (editing === id) resetForm();
  };

  const toggleBanner = (id) => {
    setOfferBanners((current) =>
      current.map((banner) =>
        banner.id === id
          ? { ...banner, enabled: !banner.enabled }
          : banner
      )
    );
  };

  return (
    <div className="offers-admin-page">
      <div className="cms-hero-head">
        <div>
          <span className="cms-kicker">HOMEPAGE OFFER CAROUSEL</span>
          <h2>Offers & Banners</h2>
          <p>
            Add as many promotional banner images as your website needs.
            Upload multiple images together, edit them anytime, or paste an image URL.
          </p>
        </div>

        <div className="offers-admin-count-pill">
          <ImageIcon size={15} />
          {offerBanners.length} banners
        </div>
      </div>

      <Panel title={editing ? "Edit banner" : "Add new banners"} right={<Flame size={16} color={BRASS} />}>
        <div className="offers-upload-actions">
          <label className="offers-upload-primary">
            <ImageIcon size={17} />
            <span>
              {uploading ? "Uploading…" : "Upload multiple images"}
            </span>
            <small>No banner-count limit</small>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={uploadMultipleImages}
              disabled={uploading}
              hidden
            />
          </label>

          <div className="offers-upload-divider">OR</div>

          <div className="offers-url-box">
            <div className="cms-field">
              <label>Banner image URL</label>
              <input
                value={form.image.startsWith("data:") ? "Local uploaded image" : form.image}
                placeholder="https://.../offer-banner.jpg"
                onChange={(event) =>
                  setForm((current) => ({ ...current, image: event.target.value }))
                }
              />
            </div>
            <button type="button" style={btnBrass} onClick={addImageUrl}>
              <Plus size={14} /> Add Image
            </button>
          </div>
        </div>

        <form className="offers-banner-form" onSubmit={saveBanner}>
          <AdminField
            label="Image description"
            value={form.alt}
            placeholder="Weekend combo offer"
            onChange={(value) => setForm((current) => ({ ...current, alt: value }))}
          />
          <AdminField
            label="Banner heading"
            value={form.title}
            placeholder="Weekend Pizza Celebration"
            onChange={(value) => setForm((current) => ({ ...current, title: value }))}
          />
          <AdminField
            label="Banner subtext"
            value={form.subtitle}
            placeholder="Hot, fresh and ready for your table."
            onChange={(value) => setForm((current) => ({ ...current, subtitle: value }))}
          />
          <AdminField
            label="Button text"
            value={form.buttonText}
            placeholder="Explore Offer"
            onChange={(value) => setForm((current) => ({ ...current, buttonText: value }))}
          />

          <label className="offers-enabled-check">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  enabled: event.target.checked
                }))
              }
            />
            Show this banner on the homepage
          </label>

          <div className="offers-form-buttons">
            <button type="submit" style={btnBrass}>
              {editing ? <Pencil size={14} /> : <Plus size={14} />}
              {editing ? "Save changes" : "Add banner"}
            </button>
            {editing && (
              <button type="button" style={ghostButton} onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        {notice && <div className="offers-admin-notice">{notice}</div>}
      </Panel>

      <div className="offers-admin-list-head">
        <div>
          <span className="cms-kicker">BANNER LIBRARY</span>
          <h3>All promotional images</h3>
        </div>
        <span>{offerBanners.filter((banner) => banner.enabled !== false).length} live</span>
      </div>

      <div className="offers-admin-grid">
        {offerBanners.map((banner, index) => (
          <article className="admin-banner-card offers-admin-card" key={banner.id || `banner-${index}`}>
            <div className="admin-banner-preview offers-preview">
              <img
                src={banner.image}
                alt={banner.alt || "Promotional banner"}
                onError={(event) => {
                  event.currentTarget.style.opacity = "0.22";
                }}
              />
              <span className={`admin-banner-status ${banner.enabled !== false ? "active" : ""}`}>
                {banner.enabled !== false ? "LIVE" : "HIDDEN"}
              </span>
              <span className="offers-index-badge">#{index + 1}</span>
            </div>

            <div className="offers-admin-card-body">
              <strong>{banner.title || banner.alt || "Promotional banner"}</strong>
              <span>{banner.subtitle || "Homepage promotional image"}</span>

              <div className="offers-admin-card-actions">
                <button type="button" style={ghostButton} onClick={() => startEdit(banner)}>
                  <Pencil size={13} /> Edit
                </button>
                <button type="button" style={ghostButton} onClick={() => toggleBanner(banner.id)}>
                  {banner.enabled !== false ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  style={{ ...ghostButton, color: "#C84632", borderColor: "rgba(200,70,50,.18)" }}
                  onClick={() => removeBanner(banner.id)}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </article>
        ))}

        {offerBanners.length === 0 && (
          <div className="orders-empty">
            <ImageIcon size={30} />
            <h3>No banners yet</h3>
            <p>Upload one or more banner images to build your homepage carousel.</p>
            <button type="button" style={btnBrass} onClick={startAdd}>
              <Plus size={14} /> Add first banner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   WEBSITE CONTENT / CMS
   ========================================================= */

function AdminWebsiteContent({ siteContent, setSiteContent }) {
  const [form, setForm] = useState(() => ({ ...seedSiteContent(), ...siteContent }));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm((current) => ({ ...current, ...siteContent }));
  }, [siteContent]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const uploadImage = (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image smaller than 2 MB for browser storage.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update(key, String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const imageKeys = [
      "restaurantNameBackgroundImage",
      "heroMainImage",
      "heroLeftImage",
      "heroRightImage",
      "aboutImage"
    ];

    const compressDataImage = (value, maxBytes = 110000) =>
      new Promise((resolve) => {
        const source = String(value || "");
        if (!source.startsWith("data:image/") || source.length <= maxBytes) {
          resolve(source);
          return;
        }

        const image = new Image();

        image.onload = () => {
          try {
            const maxSide = 1600;
            const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
            canvas.height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));

            const context = canvas.getContext("2d");
            if (!context) {
              resolve(source);
              return;
            }

            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            let quality = 0.82;

            const attempt = () => {
              canvas.toBlob((blob) => {
                if (!blob) {
                  resolve(source);
                  return;
                }

                if (blob.size <= maxBytes || quality <= 0.45) {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result || source));
                  reader.onerror = () => resolve(source);
                  reader.readAsDataURL(blob);
                  return;
                }

                quality -= 0.08;
                attempt();
              }, "image/jpeg", quality);
            };

            attempt();
          } catch {
            resolve(source);
          }
        };

        image.onerror = () => resolve(source);
        image.src = source;
      });

    const nextForm = { ...form };

    for (const key of imageKeys) {
      nextForm[key] = await compressDataImage(nextForm[key]);
    }

    if (Array.isArray(nextForm.offerBanners)) {
      nextForm.offerBanners = await Promise.all(
        nextForm.offerBanners.map(async (banner) => ({
          ...banner,
          image: await compressDataImage(banner?.image)
        }))
      );
    }

    setForm(nextForm);
    setSiteContent(nextForm);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const input = (key, label, placeholder = "", multiline = false) => (
    <div className="cms-field">
      <label>{label}</label>
      {multiline ? (
        <textarea value={form[key] || ""} placeholder={placeholder} onChange={(e) => update(key, e.target.value)} rows={4} />
      ) : (
        <input value={form[key] || ""} placeholder={placeholder} onChange={(e) => update(key, e.target.value)} />
      )}
    </div>
  );

  const imageField = (key, label) => (
    <div className="cms-image-field">
      {input(key, label, "https://...")}
      <label className="cms-upload-button">
        <ImageIcon size={14} /> Upload from computer
        <input type="file" accept="image/*" onChange={(e) => uploadImage(key, e)} hidden />
      </label>
      {form[key] && <img src={form[key]} alt="CMS preview" className="cms-image-preview" />}
    </div>
  );

  return (
    <div className="cms-wrap">
      <div className="cms-hero-head">
        <div>
          <span className="cms-kicker">FULL WEBSITE CONTROL</span>
          <h2>Homepage Content Manager</h2>
          <p>Change homepage text and imagery from one place. Save once and the customer-facing page updates immediately.</p>
        </div>
        <button className="btn-primary cms-save-btn" onClick={save}>
          <Save size={15} /> {saved ? "Saved" : "Save All Changes"}
        </button>
      </div>

      <Panel title="01 · Restaurant background" right={<ImageIcon size={16} color={BRASS} />}>
        <div className="cms-hero-image-manager" style={{ marginTop: 0 }}>
          <div className="cms-hero-image-manager-head">
            <div>
              <strong>Restaurant Name Area Background</strong>
              <span>Background image behind the restaurant name area (CLOCK TOWER).</span>
            </div>
            <span className="cms-hero-image-status">ADMIN CONTROLLED</span>
          </div>
          {imageField("restaurantNameBackgroundImage", "Background image")}
        </div>
      </Panel>

      <Panel title="02 · Hero section" right={<Type size={16} color={BRASS} />}>
        <div className="cms-grid-2">
          {input("heroEyebrow", "Eyebrow text")}
          {input("heroTitle", "Main headline", "Savor the Taste of\nPerfection.", true)}
          <div className="cms-field cms-span-2">{input("heroText", "Hero description", "Fresh ingredients...", true)}</div>
        </div>
        <div className="cms-image-grid">
          {imageField("heroMainImage", "Main hero image")}
          {imageField("heroLeftImage", "Left floating food image")}
          {imageField("heroRightImage", "Right floating food image")}
        </div>
      </Panel>

      <Panel title="Homepage menu / signature section" right={<Package size={16} color={BRASS} />}>
        <div className="cms-grid-2">
          {input("signatureTitle", "Section title")}
          {input("signatureText", "Section description", "Classic favourites...", true)}
        </div>
      </Panel>

      <Panel title="About section" right={<ChefHat size={16} color={BRASS} />}>
        <div className="cms-grid-2">
          {input("aboutEyebrow", "Eyebrow")}
          {input("aboutTitle", "Heading", "Good food.\nGood mood.", true)}
          <div className="cms-span-2">{input("aboutText", "Description", "Carefully selected ingredients...", true)}</div>
        </div>
        {imageField("aboutImage", "About section image")}
      </Panel>

      <Panel title="Reviews section" right={<MessageSquare size={16} color={BRASS} />}>
        <div className="cms-grid-2">
          {input("reviewsTitle", "Review heading")}
          {input("reviewsText", "Review section description", "Good food, warm service...", true)}
        </div>
      </Panel>

      <Panel title="AR Coming Soon section" right={<Sparkles size={16} color={BRASS} />}>
        <div className="cms-grid-2">
          {input("arKicker", "AR kicker")}
          {input("arTitle", "AR headline", "See your food\nbefore it arrives.", true)}
          <div className="cms-span-2">{input("arText", "AR description", "Preview selected dishes...", true)}</div>
          <div className="cms-span-2">{input("arTags", "AR tags", "3D Food Preview,Table View,Coming Soon")}</div>
        </div>
      </Panel>

      <Panel title="Final order call-to-action" right={<ShoppingCart size={16} color={BRASS} />}>
        <div className="cms-grid-2">
          {input("finalEyebrow", "Eyebrow")}
          {input("finalTitle", "Heading", "Don't Wait —\nOrder Now!", true)}
          <div className="cms-span-2">{input("finalText", "Description", "Freshly prepared favourites...", true)}</div>
        </div>
      </Panel>

      <Panel title="Footer content" right={<ReceiptText size={16} color={BRASS} />}>
        <div className="cms-grid-2">
          {input("footerTagline", "Footer tagline", "Fresh food...", true)}
          {input("footerHours", "Opening hours")}
          {input("footerDays", "Opening days")}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   DELIVERY CONTROL
   ========================================================= */

function AdminDelivery({ orders, setOrders }) {
  const [selected, setSelected] = useState(null);
  const safeOrders = Array.isArray(orders) ? orders : [];
  const deliveryOrders = safeOrders.filter((order) => order.type === "Delivery");

  const statusMessage = (status, order) => {
    const first = orderText(order.customer, "Customer");
    if (status === "Out for Delivery") return `Hi ${first}, your order ${order.id} is out for delivery.`;
    if (status === "Delivered") return `Your order ${order.id} has been delivered successfully. Thank you!`;
    if (status === "Ready") return `Your order ${order.id} is ready for pickup/delivery.`;
    return `Order ${order.id} is now ${status}.`;
  };

  const setStatus = async (id, status) => {
    const order = orders.find((item) => item.id === id);
    if (!order) return;

    const message = statusMessage(status, order);
    const notificationTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });

    try {
      const changes = { status, notification: message, notificationTime };
      const exactRef = doc(db, "orders", id);

      try {
        await updateDoc(exactRef, { ...changes, updatedAt: serverTimestamp() });
      } catch (error) {
        if (error?.code !== "not-found") throw error;

        const snapshot = await getDocs(query(collection(db, "orders"), where("id", "==", id)));
        if (snapshot.empty) {
          await setDoc(exactRef, { ...order, ...changes, id, updatedAt: serverTimestamp() }, { merge: true });
        } else {
          await Promise.all(
            snapshot.docs.map((item) =>
              updateDoc(item.ref, { ...changes, updatedAt: serverTimestamp() })
            )
          );
        }
      }

      setOrders((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, ...changes }
            : item
        )
      );

      if (["Out for Delivery", "Delivered"].includes(status)) {
        alert(
          `Customer notification prepared for ${order.phone || "customer"}.\n\n${message}\n\nFor real SMS delivery, connect an SMS provider/backend.`
        );
      }
    } catch (error) {
      console.error("Delivery status update failed:", error);
      window.alert(error?.message || "Unable to update delivery status in Firebase.");
    }
  };

  return (
    <div className="delivery-admin-wrap">
      <div className="cms-hero-head">
        <div>
          <span className="cms-kicker">LIVE DELIVERY OPERATIONS</span>
          <h2>Delivery Control</h2>
          <p>Move orders through delivery stages and keep the customer-facing status in sync.</p>
        </div>
        <div className="delivery-live-badge"><span /> {deliveryOrders.length} delivery orders</div>
      </div>

      <div className="delivery-kanban">
        {deliveryOrders.length === 0 ? (
          <Panel title="No delivery orders"><div className="orders-empty">New delivery orders will appear here.</div></Panel>
        ) : deliveryOrders.map((order) => (
          <article className="delivery-order-card" key={order.id}>
            <div className="delivery-order-top">
              <div><strong>{order.id}</strong><span>{order.time || "just now"}</span></div>
              <StatusBadge status={order.status} />
            </div>
            <div className="delivery-customer">
              <div className="delivery-customer-icon"><Truck size={15} /></div>
              <div><strong>{orderText(order.customer, "Customer")}</strong><span>{orderText(order.phone, "No phone")}</span><span>{orderText(order.address, "Address not added")}</span></div>
            </div>
            <div className="delivery-items-mini">
              {(Array.isArray(order.items) ? order.items : []).map((item, index) => <div key={index}><span>{orderText(item?.qty, 0)}× {orderText(item?.name, "Item")}</span><strong>{money(Number(item?.qty || 0) * Number(item?.price || 0))}</strong></div>)}
            </div>
            {order.notification && <div className="delivery-notice"><MessageSquare size={13} /><span>{order.notification}</span></div>}
            <div className="delivery-actions">
              {[["Accepted", "Accept"], ["Preparing", "Start Kitchen"], ["Ready", "Ready"], ["Out for Delivery", "Out for Delivery"], ["Delivered", "Delivered ✓"]].map(([status, label]) => (
                <button key={status} className={order.status === status ? "active" : ""} disabled={order.status === status || order.status === "Delivered"} onClick={() => setStatus(order.id, status)}>{label}</button>
              ))}
              <button className="delivery-details-btn" onClick={() => setSelected(order)}>Details</button>
            </div>
          </article>
        ))}
      </div>

      {selected && <div className="admin-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
        <div className="admin-modal-card">
          <button className="admin-modal-close" onClick={() => setSelected(null)}><X size={16} /></button>
          <span className="cms-kicker">DELIVERY DETAILS</span>
          <h3>{orderText(selected.id, "Order")}</h3>
          <div className="detail-grid">
            <div><span>Customer</span><strong>{orderText(selected.customer, "Customer")}</strong></div>
            <div><span>Phone</span><strong>{orderText(selected.phone, "—")}</strong></div>
            <div className="detail-grid-wide"><span>Address</span><strong>{orderText(selected.address, "—")}</strong></div>
            <div><span>Payment</span><strong>{orderText(selected.paymentMethod, "Not recorded")}</strong></div>
            <div><span>Total</span><strong>{money(selected.total)}</strong></div>
          </div>
        </div>
      </div>}
    </div>
  );
}

/* =========================================================
   PAYMENT / UPI CONTROL
   ========================================================= */

function AdminPayments({ paymentSettings, setPaymentSettings, hotel }) {
  const [form, setForm] = useState(() => ({ ...seedPaymentSettings(), ...paymentSettings }));
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm((current) => ({ ...current, ...paymentSettings })), [paymentSettings]);

  const save = async () => {
    const qrLink = String(form.qrImage || "").trim();

    if (qrLink && !/^https?:\/\//i.test(qrLink)) {
      return alert("Please enter a valid QR image link starting with http:// or https://");
    }

    const nextSettings = { ...form, qrImage: qrLink };
    setPaymentSettings(nextSettings);

    try {
      await setDoc(
        doc(db, "settings", "paymentSettings"),
        { ...nextSettings, qrImage: qrLink, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.error("Firestore payment settings error:", error);
      alert("QR link was saved locally, but could not be synced to Firebase. Please check Firestore Rules.");
      return;
    }

    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="payment-admin-wrap">
      <div className="cms-hero-head">
        <div>
          <span className="cms-kicker">ONLINE PAYMENTS</span>
          <h2>UPI & Payment Settings</h2>
          <p>Paste your QR image link. Customers will see it automatically when they select UPI at checkout.</p>
        </div>
        <button className="btn-primary cms-save-btn" onClick={save}><Save size={15} /> {saved ? "Saved" : "Save Payment Settings"}</button>
      </div>

      <Panel title="Available payment methods" right={<CreditCard size={16} color={BRASS} />}>
        <div className="payment-toggle-grid">
          {[
            ["cashEnabled", "Cash / Counter", "Accept pay-at-delivery or counter payments."],
            ["upiEnabled", "UPI", "Show UPI with QR at checkout."],
            ["cardEnabled", "Cards", "Keep the card option visible."],
          ].map(([key, title, sub]) => (
            <button key={key} type="button" className={`payment-toggle-card ${form[key] ? "active" : ""}`} onClick={() => setForm((current) => ({ ...current, [key]: !current[key] }))}>
              <span className="payment-toggle-icon">{key === "upiEnabled" ? "◉" : key === "cardEnabled" ? "▣" : "₹"}</span>
              <span><strong>{title}</strong><small>{sub}</small></span>
              <span className={`mini-switch ${form[key] ? "on" : ""}`}><i /></span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="UPI merchant details" right={<CircleDollarSign size={16} color={BRASS} />}>
        <div className="cms-grid-2">
          <div className="cms-field"><label>UPI ID</label><input value={form.upiId || ""} onChange={(e) => setForm((c) => ({ ...c, upiId: e.target.value }))} placeholder="restaurant@upi" /></div>
          <div className="cms-field"><label>Merchant name</label><input value={form.merchantName || hotel?.name || ""} onChange={(e) => setForm((c) => ({ ...c, merchantName: e.target.value }))} /></div>
        </div>
        <div className="upi-admin-upload">
          <div>
            <span className="cms-kicker">QR IMAGE LINK</span>
            <h3>Customer payment QR</h3>
            <p>Paste the direct URL of your QR image. It is shown when UPI is selected during checkout.</p>
            <div className="cms-field">
              <label>QR image link</label>
              <input
                type="url"
                value={form.qrImage || ""}
                onChange={(e) => setForm((current) => ({ ...current, qrImage: e.target.value }))}
                placeholder="https://example.com/your-qr.png"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="upi-admin-preview">
            {form.qrImage ? <img src={form.qrImage} alt="UPI QR preview" /> : <QRVisual seed={form.upiId || "KAVERI-UPI"} />}
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   DIGITAL MENU ADMIN
   ========================================================= */

function AdminDigitalMenu() {
  const [token, setToken] =
    useState("KVK-2026-A1");

  const url =
    `https://kaverikitchen.example/menu/${token}`;

  const downloadQr =
    () => {
      alert(
        "Connect a real QR generator library/backend here for downloadable QR files."
      );
    };

  return (
    <Panel title="Digital Menu QR">

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "230px 1fr",
          gap: 30,
          alignItems:
            "center"
        }}
      >
        <div
          style={{
            background:
              "#ffffff",
            borderRadius: 20,
            padding: 20,
            display: "grid",
            placeItems:
              "center"
          }}
        >
          <QRVisual
            seed={token}
          />
        </div>

        <div>

          <div
            style={{
              fontSize: 12,
              color: "#8A7770",
              marginBottom: 7
            }}
          >
            Menu URL
          </div>

          <div
            style={{
              fontSize: 12,
              background:
                "#fff8f4",
              border:
                "1px solid rgba(76,21,4,0.09)",
              borderRadius: 11,
              padding:
                "11px 12px",
              marginBottom: 16,
              wordBreak:
                "break-all",
              color: INK
            }}
          >
            {url}
          </div>

          <div
            style={{
              display:
                "flex",
              gap: 8,
              flexWrap:
                "wrap"
            }}
          >
            <button
              style={btnBrass}
              onClick={
                downloadQr
              }
            >
              <Download
                size={13}
              />
              Download QR
            </button>

            <button
              onClick={() =>
                setToken(
                  `KVK-2026-${Math.random()
                    .toString(
                      36
                    )
                    .slice(
                      2,
                      6
                    )
                    .toUpperCase()}`
                )
              }
              style={{
                background:
                  "#fff0eb",
                color: INK,
                border:
                  "1px solid rgba(76,21,4,0.1)",
                borderRadius:
                  10,
                padding:
                  "10px 15px",
                cursor:
                  "pointer",
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 6,
                fontWeight:
                  700
              }}
            >
              <RefreshCw
                size={13}
              />
              Regenerate
            </button>
          </div>

          <p
            style={{
              fontSize: 12,
              color:
                "#8A7770",
              marginTop: 17,
              maxWidth: 450
            }}
          >
            Use this QR destination
            for table cards, receipts
            and entrance signage.
          </p>

        </div>
      </div>
    </Panel>
  );
}

/* =========================================================
   QR VISUAL
   ========================================================= */

function QRVisual({
  seed
}) {
  const grid = 21;

  let hash = 0;

  for (
    let index = 0;
    index < seed.length;
    index += 1
  ) {
    hash =
      (hash * 31 +
        seed.charCodeAt(
          index
        )) &
      0x7fffffff;
  }

  const cells = [];

  let x =
    hash || 123456;

  for (
    let index = 0;
    index <
    grid * grid;
    index += 1
  ) {
    x =
      (x * 1103515245 +
        12345) &
      0x7fffffff;

    cells.push(
      x % 5 === 0 ||
      x % 7 === 0
    );
  }

  const finder = (
    x,
    y
  ) => (
    <g>
      <rect
        x={x}
        y={y}
        width="7"
        height="7"
        fill={INK}
      />

      <rect
        x={x + 1}
        y={y + 1}
        width="5"
        height="5"
        fill="#fff"
      />

      <rect
        x={x + 2}
        y={y + 2}
        width="3"
        height="3"
        fill={INK}
      />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${grid} ${grid}`}
      width="175"
      height="175"
      style={{
        display: "block"
      }}
    >
      <rect
        width={grid}
        height={grid}
        fill="#fff"
      />

      {cells.map(
        (active, index) =>
          active && (
            <rect
              key={index}
              x={
                index %
                grid
              }
              y={Math.floor(
                index /
                  grid
              )}
              width="1"
              height="1"
              fill={INK}
            />
          )
      )}

      {finder(0, 0)}

      {finder(
        grid - 7,
        0
      )}

      {finder(
        0,
        grid - 7
      )}
    </svg>
  );
}

/* =========================================================
   AR MENU
   ========================================================= */

function AdminARMenu() {
  const [shown, setShown] =
    useState(true);

  return (
    <Panel title="AR Menu">

      <div
        style={{
          display:
            "flex",
          alignItems:
            "flex-start",
          gap: 15,
          marginBottom: 18
        }}
      >
        <div
          style={{
            width: 43,
            height: 43,
            display: "grid",
            placeItems:
              "center",
            borderRadius: 13,
            background:
              "#fff0eb"
          }}
        >
          <Sparkles
            size={20}
            color={BRASS}
          />
        </div>

        <div>
          <h3
            style={{
              marginBottom: 6,
              color: INK
            }}
          >
            Augmented Reality Menu
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              color:
                "#7b6961",
              maxWidth: 650
            }}
          >
            Guests will be able to view
            selected dishes in an AR
            experience before ordering.
          </p>
        </div>
      </div>

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          padding:
            "15px 16px",
          background:
            "#fff8f4",
          borderRadius:
            14
        }}
      >
        <div>
          <strong
            style={{
              display:
                "block",
              color: INK,
              marginBottom:
                4
            }}
          >
            Show Coming Soon
          </strong>

          <span
            style={{
              fontSize: 11,
              color:
                "#89766f"
            }}
          >
            Display the AR section
            on the website and menu.
          </span>
        </div>

        <Toggle
          on={shown}
          onClick={() =>
            setShown(
              (current) =>
                !current
            )
          }
          good
        />
      </div>

      <div
        style={{
          marginTop: 14,
          fontSize: 12,
          color:
            "#89766f"
        }}
      >
        Planned flow: Choose Dish →
        View AR → Launch AR →
        See 3D dish → View details.
      </div>
    </Panel>
  );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function AdminSettings({
  hotel,
  setHotel
}) {
  const [form, setForm] =
    useState(hotel);

  return (
    <Panel title="Hotel Settings">

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: 14,
          maxWidth: 760
        }}
      >
        <AdminField
          label="Website name"
          value={form.name}
          onChange={(value) =>
            setForm({
              ...form,
              name: value
            })
          }
        />

        <AdminField
          label="Phone"
          value={form.phone}
          onChange={(value) =>
            setForm({
              ...form,
              phone: value
            })
          }
        />

        <div
          style={{
            gridColumn:
              "1 / -1"
          }}
        >
          <AdminField
            label="Address"
            value={
              form.address
            }
            onChange={(value) =>
              setForm({
                ...form,
                address:
                  value
              })
            }
          />
        </div>

        <div
          style={{
            gridColumn:
              "1 / -1"
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#8a7770",
              marginBottom: 5
            }}
          >
            About
          </div>

          <textarea
            value={form.about}
            onChange={(event) =>
              setForm({
                ...form,
                about:
                  event.target
                    .value
              })
            }
            rows={4}
            style={{
              width: "100%",
              padding: 12,
              border:
                "1px solid rgba(76,21,4,0.12)",
              borderRadius: 11,
              background:
                "#fff",
              color: INK,
              resize:
                "vertical",
              outline:
                "none"
            }}
          />
        </div>
      </div>

      <button
        onClick={async () => {
          const nextHotel = {
            name: String(form.name || "").trim(),
            phone: String(form.phone || ""),
            address: String(form.address || ""),
            about: String(form.about || "")
          };

          if (!nextHotel.name) {
            alert("Please enter a website name.");
            return;
          }

          setHotel(nextHotel);

          try {
            await setDoc(
              doc(db, "settings", "hotel"),
              {
                ...nextHotel,
                updatedAt: serverTimestamp()
              },
              { merge: true }
            );

            alert("Website settings saved successfully.");
          } catch (error) {
            console.error("Website name sync failed:", error);
            alert(
              `Firebase sync failed [${error?.code || "unknown"}].\n\n${error?.message || "Unable to sync website settings to Firebase."}`
            );
          }
        }}
        style={{
          ...btnBrass,
          marginTop: 17
        }}
      >
        Save Settings
      </button>
    </Panel>
  );
}

/* =========================================================
   ADMIN FIELD
   ========================================================= */

function UploadIconFallback() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 20,
        height: 20,
        display: "grid",
        placeItems: "center",
        borderRadius: 6,
        background: "#fff0eb",
        color: BRASS,
        fontWeight: 900
      }}
    >
      ↑
    </span>
  );
}

function AdminField({
  label,
  value,
  onChange,
  placeholder
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "#8a7770",
          marginBottom: 5
        }}
      >
        {label}
      </div>

      <input
        value={value}
        placeholder={
          placeholder
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        style={{
          width: "100%",
          minHeight: 42,
          background:
            "#fff",
          border:
            "1px solid rgba(76,21,4,0.12)",
          borderRadius: 10,
          padding:
            "9px 11px",
          color: INK,
          fontSize: 13,
          outline: "none"
        }}
      />
    </div>
  );
}

/* =========================================================
   ADMIN TABLE / BUTTON STYLES
   ========================================================= */

const tableStyle = {
  width: "100%",
  borderCollapse:
    "collapse",
  fontSize: 13
};

const thStyle = {
  textAlign: "left",
  fontSize: 11,
  color: "#8A7770",
  padding:
    "0 10px 10px",
  fontWeight: 700
};

const tdStyle = {
  padding: "12px 10px",
  verticalAlign:
    "middle",
  color: INK
};

const selStyle = {
  width: "100%",
  minHeight: 42,
  background:
    "#fff",
  border:
    "1px solid rgba(76,21,4,0.12)",
  borderRadius: 10,
  padding:
    "9px 10px",
  color: INK,
  fontSize: 13,
  outline: "none"
};

const btnBrass = {
  background: BRASS,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding:
    "10px 16px",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 12,
  display: "inline-flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  gap: 6,
  minHeight: 42
};

export { AdminLogin, AdminApp };