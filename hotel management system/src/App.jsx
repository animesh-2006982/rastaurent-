import React, { useEffect, useMemo, useRef, useState } from "react";
import HeroPage from "./Hero/HeroPage.jsx";
import MainPage from "./Main/MainPage.jsx";
import DigitalMenu from "./Menu/DigitalMenu.jsx";
import OrderPage from "./Order/OrderPage.jsx";
import CartPage from "./Cart/CartPage.jsx";
import RoomsPage from "./Rooms/RoomsPage.jsx";
import UserLogin from "./Auth/UserLogin.jsx";

import { createOrder, subscribeToOrders } from "./services/orderService.js";
import { getDishImage } from "./data/menuData.js";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

const FALLBACK_PRODUCTS = [
  { id: "chicken-momo", name: "Chicken Momo", category: "Momo", price: 180, rating: 4.8, available: true, desc: "Juicy chicken momos served hot with house chutney." },
  { id: "veg-momo", name: "Veg Momo", category: "Momo", price: 150, rating: 4.5, available: true, desc: "Fresh vegetable momos with a spicy house chutney." },
  { id: "chicken-pizza", name: "Chicken Pizza", category: "Italian", price: 399, rating: 4.9, available: true, desc: "Crisp base, rich cheese and seasoned chicken." },
  { id: "chicken-biryani", name: "Chicken Biryani", category: "Biryani", price: 280, rating: 4.7, available: true, desc: "Aromatic basmati rice, chicken and signature spices." },
  { id: "paneer-butter-masala", name: "Paneer Butter Masala", category: "Indian", price: 220, rating: 4.6, available: true, desc: "Soft paneer in a creamy tomato-based gravy." },
  { id: "french-fries", name: "French Fries", category: "Chinese", price: 120, rating: 4.4, available: true, desc: "Golden crisp fries with a light seasoning." },
  { id: "cold-drink", name: "Cold Drink", category: "Drinks", price: 60, rating: 4.2, available: true, desc: "Chilled refreshing drink." },
  { id: "gulab-jamun", name: "Gulab Jamun", category: "Desserts", price: 90, rating: 4.7, available: true, desc: "Soft warm gulab jamun finished with sweet syrup." },
  { id: "chilli-chicken", name: "Chilli Chicken", category: "Chinese", price: 260, rating: 4.6, available: true, desc: "Crispy chicken tossed in a spicy Indo-Chinese sauce." },
  { id: "chicken-fry", name: "Chicken Fry", category: "Chicken", price: 399, rating: 4.5, available: true, desc: "Crispy seasoned chicken prepared fresh." },
].map((item) => ({ ...item, img: getDishImage(item) }));

const DEFAULT_HOTEL = {
  name: "clock tower",
  phone: "+91 98765 43210",
  address: "44 MG Road, Guwahati, Assam",
  about: "A modern restaurant serving Indian, Chinese and Italian favourites — dine-in, takeaway or delivered to your door.",
};


function BackToHome({ nav }) {
  return (
    <button
      type="button"
      onClick={() => nav("main")}
      aria-label="Back to Home"
      title="Back to Home"
      style={{
        position: "fixed",
        top: 22,
        left: 22,
        zIndex: 99999,
        height: 44,
        padding: "0 18px",
        border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: 999,
        background: "rgba(255,248,243,0.96)",
        color: "#4C1504",
        boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: "0.1px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 16px 34px rgba(0,0,0,0.22)";
        e.currentTarget.style.background = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.18)";
        e.currentTarget.style.background = "rgba(255,248,243,0.96)";
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 17, lineHeight: 1 }}>←</span>
      <span>Back to Home</span>
    </button>
  );
}

function readUser() {
  try {
    const raw = localStorage.getItem("kaveri-current-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitialView() {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const routes = {
    "/": "hero",
    "/hero": "hero",
    "/main": "main",
    "/menu": "menu",
    "/rooms": "rooms",
    "/order": "order",
    "/cart": "cart",
    "/orders": "order",
    "/login": "login",
  };
  return routes[path] || "hero";
}

export default function App() {
  const [view, setView] = useState(getInitialView);
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [reviews, setReviews] = useState([]);
  const [siteContent, setSiteContent] = useState({});
  const [paymentSettings, setPaymentSettings] = useState({
    merchantName: "Clock Tower",
    upiId: "",
    qrImage: "",
    cashEnabled: true,
    upiEnabled: true,
    cardEnabled: true
  });
  const [hotel, setHotel] = useState(DEFAULT_HOTEL);
  const [cart, setCart] = useState({});
  const [currentUser, setCurrentUser] = useState(readUser);
  const [orders, setOrders] = useState([]);

  // Prevent duplicate checkout submissions while the current order is being created.
  const orderSubmitLockRef = useRef(false);

  // ADMIN <-> PUBLIC FIRESTORE SYNC
  // Read the same Firestore collections/documents used by the current Admin panel.
  // The existing public UI/components are unchanged.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
        setProducts(
          rows.map((item) => ({
            ...item,
            img: item.img || getDishImage(item)
          }))
        );
      },
      (error) => {
        console.error("Public products sync failed:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "reviews"),
      (snapshot) => {
        setReviews(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
      },
      (error) => {
        console.error("Public reviews sync failed:", error);
        setReviews([]);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "settings", "siteContent"),
      (snapshot) => {
        if (snapshot.exists()) {
          setSiteContent((current) => ({
            ...current,
            ...snapshot.data()
          }));
        }
      },
      (error) => {
        console.error("Public website content sync failed:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Admin -> Public restaurant/site settings.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "settings", "hotel"),
      (snapshot) => {
        if (snapshot.exists()) {
          setHotel((current) => ({
            ...current,
            ...snapshot.data()
          }));
        }
      },
      (error) => {
        console.error("Public restaurant settings sync failed:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Keep public checkout synced with Admin → Payments / UPI settings.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "settings", "paymentSettings"),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data() || {};

        setPaymentSettings((current) => ({
          ...current,
          ...data,
          merchantName: String(data.merchantName || current.merchantName || "Clock Tower"),
          upiId: String(data.upiId || ""),
          qrImage: String(data.qrImage || ""),
          cashEnabled: data.cashEnabled !== false,
          upiEnabled: data.upiEnabled !== false,
          cardEnabled: data.cardEnabled !== false
        }));
      },
      (error) => {
        console.error("Payment settings sync failed:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("kaveri-cart");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {
      setCart({});
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("kaveri-cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    if (!currentUser?.id) {
      setOrders([]);
      return undefined;
    }

    const unsubscribe = subscribeToOrders(
      (rows) => {
        const userId = String(currentUser.id || "");
        const userMobile = String(currentUser.mobile || "").replace(/\D/g, "");

        const ownOrders = (Array.isArray(rows) ? rows : []).filter((order) => {
          const orderCustomerId = String(order.customerId || order.customer?.id || "");
          const orderPhone = String(order.phone || order.customer?.mobile || "").replace(/\D/g, "");

          return (userId && orderCustomerId === userId) ||
            (userMobile && orderPhone === userMobile);
        });

        setOrders(ownOrders);
      },
      (error) => {
        console.error("Customer orders sync failed:", error);
        setOrders([]);
      }
    );

    return () => unsubscribe?.();
  }, [currentUser?.id, currentUser?.mobile]);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + Math.max(0, Number(qty || 0)), 0),
    [cart]
  );

  const nav = (target) => {
    const aliases = { home: "main", restaurant: "main", landing: "main", myOrders: "order", orders: "order" };
    const next = aliases[target] || target || "hero";

    if ((next === "order" || next === "cart" || next === "orders") && !currentUser) {
      setView("login");
      window.history.pushState({}, "", "/login");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const paths = {
      hero: "/hero",
      main: "/main",
      menu: "/menu",
      rooms: "/rooms",
      order: "/order",
      cart: "/cart",
      orders: "/order",
      login: "/login",
    };

    setView(next);
    window.history.pushState({}, "", paths[next] || "/main");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handlePopState = () => setView(getInitialView());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const syncUser = () => setCurrentUser(readUser());

    window.addEventListener("storage", syncUser);
    window.addEventListener("kaveri-user-changed", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("kaveri-user-changed", syncUser);
    };
  }, []);

  const addToCart = (productId, amount = 1) => {
    setCart((current) => {
      const nextQty = Math.max(0, Number(current[productId] || 0) + Number(amount || 0));
      const next = { ...current };
      if (nextQty <= 0) delete next[productId];
      else next[productId] = nextQty;
      return next;
    });
  };

  const handleAuthenticated = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("kaveri-current-user", JSON.stringify(user));
    } catch {}

    // UserLogin normally performs this navigation itself. Keeping it here
    // makes the session flow reliable even if the auth component is changed.
    setView("order");
    window.history.pushState({}, "", "/order");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUserLogout = () => {
    try {
      localStorage.removeItem("kaveri-current-user");
    } catch {}

    window.dispatchEvent(new Event("kaveri-user-changed"));
    setCurrentUser(null);
    setOrders([]);
    setView("main");
    window.history.pushState({}, "", "/main");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async (order) => {
    if (!currentUser) {
      nav("login");
      return null;
    }

    // If checkout is already in progress, ignore the second submission.
    if (orderSubmitLockRef.current) {
      console.warn("Duplicate order submission blocked.");
      return null;
    }

    orderSubmitLockRef.current = true;

    try {
      const newOrder = {
        ...order,
        customerId: currentUser.id,
        customerName: String(order.customer || currentUser.name || "Guest"),
        status: order.status || "New",
      };

      const id = await createOrder(newOrder);
      setCart({});
      return id;
    } finally {
      orderSubmitLockRef.current = false;
    }
  };

  const sharedProps = {
    nav,
    hotel,
    products,
    reviews,
    siteContent,
    paymentSettings,
    cart,
    cartCount,
    currentUser,
    orders,
    addToCart,
    placeOrder: handlePlaceOrder,
    onUserLogout: handleUserLogout,
  };

  const showBackToHome = view !== "main" && view !== "hero";

  return (
    <>
      {showBackToHome && <BackToHome nav={nav} />}
      {view === "hero" && <HeroPage {...sharedProps} />}
      {view === "main" && <MainPage {...sharedProps} />}
      {view === "menu" && <DigitalMenu {...sharedProps} />}
      {view === "rooms" && <RoomsPage {...sharedProps} />}
      {view === "order" && <OrderPage {...sharedProps} />}
      {view === "cart" && <CartPage {...sharedProps} />}
      {view === "login" && (
        <UserLogin
          hotel={hotel}
          nav={nav}
          onAuthenticated={handleAuthenticated}
        />
      )}
    </>
  );
}
