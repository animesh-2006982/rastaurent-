import React from "react";
import { ChevronRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import "./cart.css";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function CartPage({
  products = [],
  cart = {},
  addToCart,
  nav,
  cartCount = 0,
}) {
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find((item) => String(item.id) === String(id));
      return product ? { ...product, qty } : null;
    })
    .filter(Boolean);

  const subtotal = cartItems.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.qty || 0),
    0
  );

  return (
    <main className="public-cart-page">
      <div className="public-page-wrap">
        <header className="public-cart-heading">
          <div>
            <span>YOUR ORDER</span>
            <h1>Your cart.</h1>
            <p>{cartCount} item{cartCount === 1 ? "" : "s"} ready for checkout.</p>
          </div>
          <button type="button" onClick={() => nav?.("order")}>
            Continue ordering
            <ChevronRight size={16} />
          </button>
        </header>

        {cartItems.length === 0 ? (
          <section className="public-empty-cart">
            <ShoppingBag size={34} />
            <h2>Your cart is waiting.</h2>
            <p>Add something delicious from the menu.</p>
            <button type="button" onClick={() => nav?.("order")}>Browse Menu</button>
          </section>
        ) : (
          <section className="public-cart-layout">
            <div className="public-cart-list">
              {cartItems.map((item) => (
                <article key={item.id} className="public-cart-item">
                  <div className="public-cart-image">
                    {item.img ? <img src={item.img} alt={item.name} /> : <span>🍽️</span>}
                  </div>

                  <div className="public-cart-item-info">
                    <div>
                      <h2>{item.name}</h2>
                      <p>{money(item.price)} each</p>
                    </div>

                    <div className="public-cart-item-actions">
                      <div className="public-qty-control">
                        <button type="button" onClick={() => addToCart?.(item.id, -1)}><Minus size={14} /></button>
                        <strong>{item.qty}</strong>
                        <button type="button" onClick={() => addToCart?.(item.id, 1)}><Plus size={14} /></button>
                      </div>

                      <strong>{money(item.qty * item.price)}</strong>
                      <button type="button" className="public-delete-button" onClick={() => addToCart?.(item.id, -item.qty)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="public-cart-summary">
              <span>SUMMARY</span>
              <h2>Checkout total</h2>
              <div>
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <div>
                <span>Delivery / taxes</span>
                <strong>Calculated at checkout</strong>
              </div>
              <button type="button" onClick={() => nav?.("order")}>
                Proceed to checkout
                <ChevronRight size={16} />
              </button>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
