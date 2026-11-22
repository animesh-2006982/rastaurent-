import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  ChevronRight,
  Menu as MenuIcon,
  ShoppingCart,
  Star,
  Users,
  Wifi,
  X,
  LogOut
} from "lucide-react";
import "./MainPage.css";

const fallbackProducts = [
  { id: "p1", name: "Butter Chicken", category: "Chicken", price: 280, desc: "Rich & creamy classic delicious butter chicken.", img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=85" },
  { id: "p2", name: "Chicken Biryani", category: "Indian", price: 240, desc: "Aromatic basmati rice with tender chicken.", img: "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=85" },
  { id: "p3", name: "Grilled Chicken", category: "Chicken", price: 320, desc: "Juicy grilled chicken with herbs and spices.", img: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=85" },
  { id: "p4", name: "Paneer Tikka", category: "Indian", price: 220, desc: "Soft paneer cubes grilled to perfection.", img: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=85" },
  { id: "p5", name: "Chicken Momo", category: "Momo", price: 180, desc: "Steamed dumplings with house chutney.", img: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=900&q=85" },
  { id: "p6", name: "Tandoori Platter", category: "Tandoor", price: 360, desc: "Freshly grilled tandoor favourites.", img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=900&q=85" }
];

const categoryImages = {
  All: fallbackProducts[0].img,
  Chicken: fallbackProducts[2].img,
  Mutton: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",
  Seafood: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",
  Indian: fallbackProducts[3].img,
  Chinese: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80",
  Tandoor: fallbackProducts[5].img,
  Beverages: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80",
  Desserts: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=400&q=80"
};

const rooms = [
  { name: "Deluxe Room", image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=85", guests: "2 Guests", beds: "1 Bed" },
  { name: "Premium Suite", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=85", guests: "2 Guests", beds: "1 Bed" }
];

const seedReviews = [
  { id: "r1", name: "Rohit Sharma", text: "Amazing food and great ambience. The biryani is a must try!", rating: 5 },
  { id: "r2", name: "Priya Das", text: "Very comfortable rooms and friendly staff. Highly recommended!", rating: 5 },
  { id: "r3", name: "Amit Verma", text: "Perfect place for family dining and stay. We had a wonderful experience.", rating: 5 }
];

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function Landing({
  nav,
  products = [],
  hotel = {},
  cartCount = 0,
  currentUser = null,
  onUserLogout,
  siteContent = {}
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem("kaveri-reviews");
      return saved ? JSON.parse(saved) : seedReviews;
    } catch {
      return seedReviews;
    }
  });

  const name = hotel.name || "CLOCK TOWER";
  const heroEyebrow = siteContent.heroEyebrow || "RESTAURANT · ROOMS";
  const heroTitle = siteContent.heroTitle || "CLOCK TOWER";
  const heroText = siteContent.heroText || "Good food downstairs.\\nA comfortable room upstairs.";
  const heroMainImage = siteContent.heroMainImage || "";
  const signatureTitle = siteContent.signatureTitle || "Every plate has a place.";
  const signatureText = siteContent.signatureText || "From local favourites to global flavours, discover dishes made with fresh ingredients and a lot of love.";
  const aboutEyebrow = siteContent.aboutEyebrow || "OUR STORY";
  const aboutTitle = siteContent.aboutTitle || "A Place for Food,\\nPeople and Good Times.";
  const aboutText = siteContent.aboutText || `At ${name}, we bring together great food, comfortable stays and warm hospitality. Whether you’re here for a meal or a memorable stay, we make every visit special.`;
  const aboutImage = siteContent.aboutImage || "";
  const reviewsTitle = siteContent.reviewsTitle || "What Our Guests Say";
  const reviewsText = siteContent.reviewsText || "";
  const finalEyebrow = siteContent.finalEyebrow || "PLAN YOUR VISIT";
  const finalTitle = siteContent.finalTitle || "Good Food. Comfortable Rooms.\\nUnforgettable Moments.";
  const finalText = siteContent.finalText || "";
  const footerTagline = siteContent.footerTagline || "Good food, comfortable rooms and warm hospitality.";
  const footerHours = siteContent.footerHours || "";
  const footerDays = siteContent.footerDays || "";
  const liveProducts = products.length ? products : fallbackProducts;
  const menuProducts = useMemo(() => {
    const available = liveProducts.filter((p) => p.available !== false);
    const filtered = category === "All" ? available : available.filter((p) => String(p.category || "").toLowerCase() === category.toLowerCase());
    return (filtered.length ? filtered : available).slice(0, 4);
  }, [liveProducts, category]);

  const scrollTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitFeedback = (event) => {
    event.preventDefault();
    if (!feedbackName.trim() || !feedbackText.trim()) return;
    const next = [...reviews, { id: `review-${Date.now()}`, name: feedbackName.trim(), text: feedbackText.trim(), rating: feedbackRating }];
    setReviews(next);
    try { localStorage.setItem("kaveri-reviews", JSON.stringify(next)); } catch {}
    setFeedbackName("");
    setFeedbackText("");
    setFeedbackRating(5);
    setFeedbackOpen(false);
  };

  return (
    <main className="restaurant-home clock-tower-home">
      <section className="ct-hero" id="home-section">
        <div
          className="ct-hero-bg"
          style={heroMainImage ? { backgroundImage: `url(${heroMainImage})` } : undefined}
        />
        <header className="ct-header">
          <button className="ct-brand" type="button" onClick={() => scrollTo("home-section")}>
            <span className="ct-brand-icon">♨</span>
            <span><strong>{name}</strong><small>RESTAURANT &amp; ROOMS</small></span>
          </button>
          <nav className="ct-nav">
            <button onClick={() => scrollTo("home-section")}>Home</button>
            <button onClick={() => nav("order")}>Menu</button>
            <button onClick={() => scrollTo("rooms-section")}>Rooms</button>
            <button onClick={() => scrollTo("story-section")}>Our Story</button>
            <button onClick={() => scrollTo("reviews-section")}>Reviews</button>
          </nav>
          <div className="ct-actions">
            <button className="ct-icon-btn" onClick={() => nav("order")} aria-label="Search">⌕</button>
            <button className="ct-icon-btn ct-cart" onClick={() => nav("cart")} aria-label="Cart"><ShoppingCart size={17} />{cartCount > 0 && <span>{cartCount}</span>}</button>
            <button className="ct-room-btn" onClick={() => nav("rooms")}><BedDouble size={15} /> Book a Room</button>
            <button
              type="button"
              onClick={() => currentUser ? onUserLogout?.() : nav("login")}
              aria-label={currentUser ? "Logout" : "Signup"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                minHeight: 36,
                padding: "0 13px",
                border: "1px solid rgba(255,255,255,0.28)",
                borderRadius: 999,
                background: currentUser ? "rgba(255,255,255,0.10)" : "#ffffff",
                color: currentUser ? "#ffffff" : "#3d160b",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {currentUser && <LogOut size={14} />}
              {currentUser ? "Logout" : "Signup"}
            </button>
            <button className="ct-mobile-btn" onClick={() => setMobileOpen((v) => !v)}>{mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}</button>
          </div>
        </header>
        {mobileOpen && (
          <div className="ct-mobile-menu">
            <button onClick={() => scrollTo("home-section")}>Home</button>
            <button onClick={() => { nav("order"); setMobileOpen(false); }}>Menu</button>
            <button onClick={() => scrollTo("rooms-section")}>Rooms</button>
            <button onClick={() => scrollTo("story-section")}>Our Story</button>
            <button onClick={() => scrollTo("reviews-section")}>Reviews</button>
            {currentUser && <button onClick={() => { nav("order"); setMobileOpen(false); }}>My Orders</button>}
            <button onClick={() => { if (currentUser) onUserLogout?.(); else nav("login"); setMobileOpen(false); }}>{currentUser ? "Logout" : "Signup"}</button>
          </div>
        )}
        <div className="ct-hero-content">
          <span className="ct-eyebrow">{heroEyebrow}</span>
          <h1>{String(heroTitle).split("\n").map((line, index) => (
            <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>
          ))}</h1>
          <p>{String(heroText).split("\n").map((line, index) => (
            <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>
          ))}</p>
          <div className="ct-hero-buttons">
            <button className="ct-orange-btn" onClick={() => nav("order")}>🍴 &nbsp;Order Food <ArrowRight size={16} /></button>
            <button className="ct-white-btn" onClick={() => nav("rooms")}><BedDouble size={16} /> Book a Room <ArrowRight size={16} /></button>
          </div>
        </div>
      </section>

      <section className="ct-menu-section" id="menu-section">
        <div className="ct-categories">
          {Object.keys(categoryImages).map((item) => (
            <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>
              <span><img src={categoryImages[item]} alt={item} /></span><b>{item}</b>
            </button>
          ))}
        </div>
        <div className="ct-section-head">
          <div><span>FOOD</span><h2>{String(signatureTitle).split("\n").map((line, index) => (
            <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>
          ))}</h2><p>{String(signatureText).split("\n").map((line, index) => (
            <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>
          ))}</p></div>
          <button onClick={() => nav("order")}>View Full Menu <ArrowRight size={15} /></button>
        </div>
        <div className="ct-food-grid">
          {menuProducts.map((product) => (
            <article className="ct-food-card" key={product.id}>
              <img src={product.img || fallbackProducts[0].img} alt={product.name} />
              <div className="ct-food-body">
                <h3>{product.name}</h3>
                <p>{product.desc || "Freshly prepared with care."}</p>
                <div><strong>{money(product.price)}</strong><button onClick={() => nav("order")}>🛒 Add</button></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ct-story" id="story-section">
        <div className="ct-story-copy"><span>{aboutEyebrow}</span><h2>{String(aboutTitle).split("\n").map((line, index) => (
            <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>
          ))}</h2><p>{aboutText}</p><button onClick={() => scrollTo("reviews-section")}>Discover Our Story <ArrowRight size={15} /></button></div>
        <div className="ct-story-image"><img src={aboutImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85"} alt="Restaurant interior" /></div>
      </section>

      <section className="ct-rooms" id="rooms-section">
        <div className="ct-rooms-copy"><span>ROOMS</span><h2>Comfortable Rooms<br />for a Relaxing Stay.</h2><p>Spacious, clean and well-equipped rooms for business and leisure travellers.</p><button onClick={() => nav("rooms")}>View All Rooms <ArrowRight size={15} /></button></div>
        <div className="ct-room-grid">
          {rooms.map((room) => <article className="ct-room-card" key={room.name}><img src={room.image} alt={room.name} /><div><h3>{room.name}</h3><p><Users size={13} /> {room.guests} &nbsp; <BedDouble size={13} /> {room.beds} &nbsp; <Wifi size={13} /> Free WiFi</p><button onClick={() => nav("rooms")}><ArrowRight size={18} /></button></div></article>)}
        </div>
      </section>

      <section className="ct-reviews" id="reviews-section">
        <div className="ct-review-head"><div><span>CUSTOMER REVIEWS</span><h2>{String(reviewsTitle).split("\n").map((line, index) => (
            <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>
          ))}</h2>{reviewsText && <p>{reviewsText}</p>}</div><button onClick={() => setFeedbackOpen(true)}>View All Reviews <ArrowRight size={15} /></button></div>
        <div className="ct-review-grid">{reviews.slice(-3).map((review) => <article key={review.id}><div className="ct-review-avatar">{String(review.name || "G").charAt(0)}</div><div><h3>{review.name}</h3><div className="ct-stars">{"★".repeat(review.rating || 5)}</div><p>“{review.text}”</p></div></article>)}</div>
      </section>

      <section className="ct-final">
        <div><span>{finalEyebrow}</span><h2>{String(finalTitle).split("\n").map((line, index) => (
            <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>
          ))}</h2>{finalText && <p>{finalText}</p>}</div>
        <div className="ct-final-buttons"><button className="ct-orange-btn" onClick={() => nav("order")}>🍴 Order Food Now</button><button className="ct-white-btn" onClick={() => nav("rooms")}><BedDouble size={16} /> Book Your Room</button></div>
      </section>

      <footer className="ct-footer"><div><strong>{name}</strong><small>RESTAURANT &amp; ROOMS</small></div><p>{footerTagline}</p>{(footerHours || footerDays) && <p>{footerHours}{footerHours && footerDays ? " · " : ""}{footerDays}</p>}<div><button onClick={() => scrollTo("home-section")}>Home</button><button onClick={() => nav("order")}>Menu</button><button onClick={() => nav("rooms")}>Rooms</button></div><small>© {new Date().getFullYear()} {name}. All rights reserved.</small></footer>

      {feedbackOpen && <div className="ct-modal" onMouseDown={(e) => e.target === e.currentTarget && setFeedbackOpen(false)}><form onSubmit={submitFeedback}><button type="button" className="ct-modal-close" onClick={() => setFeedbackOpen(false)}><X size={18} /></button><span>CUSTOMER FEEDBACK</span><h2>Tell us about your experience.</h2><div className="ct-feedback-stars">{[1,2,3,4,5].map((n) => <button type="button" key={n} className={n <= feedbackRating ? "active" : ""} onClick={() => setFeedbackRating(n)}><Star size={22} fill="currentColor" /></button>)}</div><input value={feedbackName} onChange={(e) => setFeedbackName(e.target.value)} placeholder="Your name" /><textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Your feedback" rows={4} /><button className="ct-orange-btn" type="submit">Submit Feedback</button></form></div>}
    </main>
  );
}
