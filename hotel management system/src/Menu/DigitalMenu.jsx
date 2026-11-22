import React, { useMemo, useState } from "react";
import { ArrowRight, QrCode, Search, Sparkles } from "lucide-react";
import { getDishImage } from "../data/menuData";
import "./digital-menu.css";

export default function DigitalMenu({ products = [], nav }) {
  const [mode, setMode] = useState("menu");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = ["All", ...new Set(products.map((item) => item.category).filter(Boolean))];

  const items = useMemo(() => {
    return products
      .filter((item) => item.available !== false)
      .filter((item) => category === "All" || String(item.category).toLowerCase() === String(category).toLowerCase())
      .filter((item) => !query.trim() || String(item.name).toLowerCase().includes(query.trim().toLowerCase()));
  }, [products, category, query]);

  return (
    <main className="digital-menu-page">
      <div className="digital-menu-wrap">
        <header className="digital-menu-heading">
          <div>
            <span>SMART DINING</span>
            <h1>Digital Menu</h1>
            <p>Browse dishes, preview what is available and order directly from the menu.</p>
          </div>

          <button type="button" onClick={() => nav?.("order")}>
            Go to order
            <ArrowRight size={16} />
          </button>
        </header>

        <div className="digital-menu-tabs">
          <button type="button" className={mode === "menu" ? "active" : ""} onClick={() => setMode("menu")}>
            <Search size={16} />
            Browse Menu
          </button>
          <button type="button" className={mode === "scan" ? "active" : ""} onClick={() => setMode("scan")}>
            <QrCode size={16} />
            Scan QR
          </button>
          <button type="button" className={mode === "ar" ? "active" : ""} onClick={() => setMode("ar")}>
            <Sparkles size={16} />
            AR Preview
          </button>
        </div>

        {mode === "menu" && (
          <>
            <div className="digital-menu-tools">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes" />
              <div>
                {categories.map((item) => (
                  <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="digital-menu-grid">
              {items.map((item) => (
                <article key={item.id} className="digital-menu-card" onClick={() => nav?.("order")}>
                  <div className="digital-menu-card-image">
                    <img src={getDishImage(item)} alt={item.name} />
                  </div>
                  <div className="digital-menu-card-body">
                    <span>{item.category}</span>
                    <h2>{item.name}</h2>
                    <p>{item.desc}</p>
                    <strong>₹{item.price}</strong>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {mode === "scan" && (
          <section className="digital-menu-feature">
            <div className="digital-menu-qr"><QrCode size={72} /></div>
            <div>
              <span>RESTAURANT QR</span>
              <h2>Scan to browse at the table.</h2>
              <p>Place the restaurant QR on tables, reception counters or takeaway packaging.</p>
            </div>
          </section>
        )}

        {mode === "ar" && (
          <section className="digital-menu-feature digital-menu-ar">
            <Sparkles size={52} />
            <div>
              <span>COMING NEXT</span>
              <h2>See selected dishes before ordering.</h2>
              <p>AR preview can be connected here when the 3D food assets are ready.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
