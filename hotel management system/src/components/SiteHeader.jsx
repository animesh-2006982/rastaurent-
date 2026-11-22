import React, { useState } from "react";
import {
  Menu as MenuIcon,
  ShoppingCart,
  UserCircle2,
  X,
  ChevronRight,
} from "lucide-react";
import "./site-components.css";

export default function SiteHeader({
  view = "landing",
  nav,
  cartCount = 0,
  hotelName = "Restaurant",
  hotelLogo = "",
  currentUser = null,
  onUserLogout,
}) {
  const [open, setOpen] = useState(false);

  const go = (target) => {
    setOpen(false);
    nav?.(target);
  };

  const scrollTo = (id) => {
    setOpen(false);
    if (view !== "landing") {
      nav?.("landing");
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
      return;
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <header className="public-site-header">
      <div className="public-site-header-inner">
        <button
          type="button"
          className="public-brand-button"
          onClick={() => go("landing")}
          aria-label={`${hotelName} home`}
        >
          {hotelLogo ? (
            <img src={hotelLogo} alt={`${hotelName} logo`} />
          ) : (
            <span className="public-brand-mark">
              {hotelName.trim().slice(0, 2).toUpperCase() || "RK"}
            </span>
          )}
          <span>
            <strong>{hotelName}</strong>
            <small>RESTAURANT · ROOMS</small>
          </span>
        </button>

        <nav className="public-desktop-nav">
          <button type="button" onClick={() => go("landing")}>Home</button>
          <button type="button" onClick={() => go("order")}>Menu</button>
          <button type="button" onClick={() => go("rooms")}>Rooms</button>
          <button type="button" onClick={() => scrollTo("about-section")}>About</button>
          <button type="button" onClick={() => scrollTo("reviews-section")}>Reviews</button>
        </nav>

        <div className="public-header-actions">
          <button type="button" className="public-cart-action" onClick={() => go("cart")}>
            <ShoppingCart size={16} />
            <span>Cart{cartCount ? ` · ${cartCount}` : ""}</span>
          </button>

          <button type="button" className="public-order-action" onClick={() => go("order")}>
            Order Food
            <ChevronRight size={15} />
          </button>

          <button
            type="button"
            className="public-login-action"
            onClick={() => {
              if (currentUser) onUserLogout?.();
              else go("login");
            }}
          >
            <UserCircle2 size={15} />
            {currentUser ? "Logout" : "Login"}
          </button>
        </div>

        <button
          type="button"
          className="public-mobile-menu"
          onClick={() => setOpen((value) => !value)}
          aria-label="Open navigation"
        >
          {open ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {open && (
        <div className="public-mobile-drawer">
          <button type="button" onClick={() => go("landing")}>Home</button>
          <button type="button" onClick={() => go("order")}>Menu</button>
          <button type="button" onClick={() => go("rooms")}>Rooms</button>
          <button type="button" onClick={() => scrollTo("about-section")}>About</button>
          <button type="button" onClick={() => scrollTo("reviews-section")}>Reviews</button>
          <button type="button" onClick={() => go("cart")}>Cart{cartCount ? ` · ${cartCount}` : ""}</button>
          <button type="button" onClick={() => go("order")}>Order Food</button>
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                onUserLogout?.();
                setOpen(false);
              } else {
                go("login");
              }
            }}
          >
            {currentUser ? "Logout" : "Login"}
          </button>
        </div>
      )}
    </header>
  );
}
