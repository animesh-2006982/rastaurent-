
"use client";

import { useMemo, useState } from "react";
import { useMenu } from "@/hooks/useMenu";
import {
  addMenuItem,
  updateMenuItem,
} from "@/services/menuService";
import styles from "./menu.module.css";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function MenuPage() {
  const { items, loading, error, setError } = useMenu();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [savingId, setSavingId] = useState<string | null>(null);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          items.map(
            (item) =>
              item.categoryName ||
              item.categoryId ||
              "General"
          )
        )
      ),
    ],
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const itemCategory =
        item.categoryName ||
        item.categoryId ||
        "General";

      const matchesCategory =
        category === "All" ||
        itemCategory === category;

      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        itemCategory.toLowerCase().includes(q) ||
        String(item.description || "")
          .toLowerCase()
          .includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [items, query, category]);

  async function toggleAvailability(
    id: string,
    available: boolean
  ) {
    setSavingId(id);
    setError(null);

    try {
      await updateMenuItem(id, {
        available: !available,
      });
    } catch (err: any) {
      setError(
        err?.message ||
        "Unable to update product availability."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleAddItem() {
    const name = window.prompt("Enter product name:");

    if (!name?.trim()) return;

    const priceText = window.prompt(
      "Enter product price:",
      "100"
    );

    if (priceText === null) return;

    const price = Number(priceText);

    if (!Number.isFinite(price) || price < 0) {
      window.alert("Please enter a valid price.");
      return;
    }

    const categoryName =
      window.prompt("Enter category:", "General") ||
      "General";

    try {
      await addMenuItem({
        name: name.trim(),
        categoryId: categoryName.trim(),
        categoryName: categoryName.trim(),
        description: "Freshly prepared.",
        price,
        available: true,
        active: true,
      });
    } catch (err: any) {
      window.alert(
        err?.message || "Unable to add product."
      );
    }
  }

  const totalItems = items.length;

  const availableItems = items.filter(
    (item) => item.available
  ).length;

  const categoriesCount = new Set(
    items.map(
      (item) => item.categoryName || item.categoryId
    )
  ).size;

  return (
    <main className={styles.page}>

      <header className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>
            MENU MANAGEMENT
          </div>

          <h1>Menu</h1>

          <p>
            Live menu synced with Admin products and Firebase.
          </p>
        </div>

        <button
          className={styles.primaryButton}
          type="button"
          onClick={handleAddItem}
        >
          <span>＋</span>
          Add Menu Item
        </button>
      </header>

      <section className={styles.stats}>

        <div className={styles.statCard}>
          <span>Total Items</span>
          <strong>{totalItems}</strong>
          <small>All active menu items</small>
        </div>

        <div className={styles.statCard}>
          <span>Available</span>
          <strong>{availableItems}</strong>
          <small>Currently available to POS</small>
        </div>

        <div className={styles.statCard}>
          <span>Categories</span>
          <strong>{categoriesCount}</strong>
          <small>Categories from products</small>
        </div>

        <div className={`${styles.statCard} ${styles.highlight}`}>
          <span>Live Connection</span>
          <strong>Firebase</strong>
          <small>Changes sync automatically</small>
        </div>

      </section>

      <section className={styles.toolbarCard}>

        <div className={styles.searchWrap}>
          <span>⌕</span>

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search menu items..."
            type="search"
          />
        </div>

        <div className={styles.categoryBar}>
          {categories.map((item) => (
            <button
              key={item}
              className={
                category === item
                  ? styles.categoryActive
                  : styles.category
              }
              onClick={() => setCategory(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

      </section>

      <section className={styles.sectionHeader}>
        <div>
          <h2>Food Items</h2>
          <p>{filtered.length} items shown</p>
        </div>
      </section>

      {error && (
        <div className={styles.empty}>
          Firebase: {error}
        </div>
      )}

      {loading && (
        <div className={styles.empty}>
          Loading menu from Firebase…
        </div>
      )}

      {!loading && (
        <section className={styles.grid}>

          {filtered.map((item) => {
            const itemCategory =
              item.categoryName ||
              item.categoryId ||
              "General";

            const foodType = (item as any).veg
              ? "Veg"
              : "Non-Veg";

            return (
              <article
                className={styles.itemCard}
                key={item.id}
              >

                <div className={styles.itemTop}>
                  <span
                    className={`${styles.foodType} ${
                      styles[foodType.toLowerCase()]
                    }`}
                  >
                    {foodType}
                  </span>

                  <span
                    className={
                      item.available
                        ? styles.available
                        : styles.unavailable
                    }
                  >
                    {item.available
                      ? "Available"
                      : "Unavailable"}
                  </span>
                </div>

                <div className={styles.foodIcon}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 12,
                      }}
                    />
                  ) : (
                    "🍽"
                  )}
                </div>

                <div className={styles.itemBody}>
                  <div className={styles.categoryText}>
                    {itemCategory}
                  </div>

                  <h3>{item.name}</h3>

                  <p>
                    {item.description ||
                      "Freshly prepared."}
                  </p>
                </div>

                <div className={styles.itemFooter}>
                  <strong>{money(item.price)}</strong>

                  <div className={styles.actions}>
                    <button
                      className={styles.toggleButton}
                      type="button"
                      disabled={savingId === item.id}
                      onClick={() =>
                        toggleAvailability(
                          item.id,
                          item.available
                        )
                      }
                    >
                      {savingId === item.id
                        ? "Saving…"
                        : item.available
                        ? "Disable"
                        : "Enable"}
                    </button>
                  </div>
                </div>

              </article>
            );
          })}

          {!filtered.length && (
            <div className={styles.empty}>
              <div>⌕</div>
              <h3>No menu items found</h3>
              <p>
                Try another search term or category.
              </p>
            </div>
          )}

        </section>
      )}

    </main>
  );
}
