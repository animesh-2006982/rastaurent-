"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import MobileNav from "@/components/layout/MobileNav";

import CategoryBar from "@/components/pos/CategoryBar";
import FoodGrid from "@/components/pos/FoodGrid";
import OrderPanel from "@/components/pos/OrderPanel";

import { useAuthContext } from "@/context/AuthContext";
import { useRestaurant } from "@/context/RestaurantContext";

export default function POSPage() {
  const router = useRouter();

  const {
    user,
    loading,
  } = useAuthContext();

  const {
    foods,
    categories,
    tables,
  } = useRestaurant();

  const [category, setCategory] =
    useState("all");

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [
    loading,
    user,
    router,
  ]);

  const visibleFoods = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return foods.filter((food) => {
      const matchesSearch =
        !query ||
        food.name
          .toLowerCase()
          .includes(query);

      return matchesSearch;
    });
  }, [foods, search]);

  if (loading) {
    return (
      <div className="ct-loading-page">
        <div className="ct-loading-card">
          <div className="ct-loading-spinner" />
          <strong>
            Loading Clock Tower POS...
          </strong>
          <span>
            Please wait
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ct-loading-page">
        <div className="ct-loading-card">
          <div className="ct-loading-spinner" />
          <strong>
            Redirecting to login...
          </strong>
        </div>
      </div>
    );
  }

  const selectedCategoryName =
    category === "all"
      ? "All Food"
      : categories.find(
          (item) =>
            item.id === category
        )?.name || "All Food";

  return (
    <div className="ct-app">

      {/* LEFT SIDEBAR */}
      <Sidebar active="POS - Cashier" />

      {/* MAIN AREA */}
      <main className="ct-main">

        {/* TOPBAR */}
        <Topbar role={user.role} />

        {/* PAGE CONTENT */}
        <div className="ct-content">

          {/* PAGE HEADER */}
          <section className="ct-pos-toolbar">

            <div className="ct-page-title">
              <h1>
                New Order
              </h1>

              <p>
                Select food items to create
                an order.
              </p>
            </div>

            {/* FOOD SEARCH */}
            <div className="ct-search">
              <SearchIcon />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search food items..."
              />

              {search && (
                <button
                  type="button"
                  className="ct-search-clear"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>
              )}
            </div>

          </section>

          {/* POS MAIN GRID */}
          <div className="ct-pos-layout">

            {/* FOOD SECTION */}
            <section className="ct-menu-area">

              {/* CATEGORIES */}
              <div className="ct-category-wrapper">
                <CategoryBar
                  categories={categories}
                  selected={category}
                  onSelect={setCategory}
                />
              </div>

              {/* FOOD HEADER */}
              <div className="ct-menu-heading">

                <div className="ct-food-title">
                  <strong>
                    {selectedCategoryName}
                  </strong>

                  <span>
                    {visibleFoods.length} items
                  </span>
                </div>

                <button
                  type="button"
                  className="ct-filter-btn"
                >
                  <span>⚙</span>
                  Filter
                </button>

              </div>

              {/* FOOD GRID */}
              <div className="ct-food-grid-wrapper">
                <FoodGrid
                  foods={visibleFoods}
                  category={category}
                  search={search}
                />
              </div>

            </section>

            {/* ORDER PANEL */}
            <aside className="ct-order-panel-wrapper">
              <OrderPanel
                tables={tables}
              />
            </aside>

          </div>

        </div>

      </main>

      {/* MOBILE NAV */}
      <MobileNav />

    </div>
  );
}

/* Small search icon component */
function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path
        d="m20 20-3.5-3.5"
      />
    </svg>
  );
}