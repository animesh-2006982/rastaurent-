import React from "react";
import "./site-components.css";

export default function SiteFooter({
  hotel = {},
  nav,
  siteContent = {},
}) {
  const name = hotel.name || "Restaurant";
  const phone = hotel.phone || "";
  const address = hotel.address || "";
  const hours = siteContent.footerHours || "11:00 AM – 11:00 PM";

  return (
    <footer className="public-site-footer">
      <div className="public-footer-inner">
        <div className="public-footer-brand">
          <div className="public-footer-mark">
            {name.trim().slice(0, 2).toUpperCase() || "RK"}
          </div>
          <div>
            <h3>{name}</h3>
            <p>{siteContent.footerTagline || "Fresh food, warm service and a place to stay."}</p>
          </div>
        </div>

        <div>
          <span>EXPLORE</span>
          <button type="button" onClick={() => nav?.("landing")}>Home</button>
          <button type="button" onClick={() => nav?.("order")}>Menu</button>
          <button type="button" onClick={() => nav?.("rooms")}>Rooms</button>
        </div>

        <div>
          <span>CONTACT</span>
          <p>{phone || "Contact restaurant"}</p>
          <p>{address || "Address available on request"}</p>
        </div>

        <div>
          <span>HOURS</span>
          <p>{hours}</p>
          <p>{siteContent.footerDays || "Open Every Day"}</p>
        </div>
      </div>

      <div className="public-footer-bottom">
        <span>© {new Date().getFullYear()} {name}. All rights reserved.</span>
        <span>Restaurant · Food · Rooms</span>
      </div>
    </footer>
  );
}
