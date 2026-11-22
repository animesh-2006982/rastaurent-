
"use client";

import { useEffect, useState } from "react";
import { subscribeCollection } from "@/firebase/firestore";
import type { MenuItem } from "@/types/menu";

type ProductDocument = Record<string, any> & {
  id: string;
};

function normalizeProduct(
  product: ProductDocument
): MenuItem {
  return {
    id: product.id,

    name: String(
      product.name || product.title || "Unnamed item"
    ),

    categoryId: String(
      product.categoryId || product.category || "General"
    ),

    categoryName: String(
      product.categoryName || product.category || "General"
    ),

    description: String(
      product.description || product.desc || ""
    ),

    price: Number(product.price || 0),

    imageUrl:
      product.imageUrl ||
      product.img ||
      product.image ||
      "",

    available: product.available !== false,
    active: product.active !== false,

    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeCollection<ProductDocument>(
      "products",

      (documents) => {
        const normalized = documents
          .map(normalizeProduct)
          .filter(
            (item) => item.available && item.active
          );

        setItems(normalized);
        setLoading(false);
        setError(null);
      },

      [],

      (err) => {
        console.error(
          "Staff menu subscription failed:",
          err
        );

        setError(
          err.message || "Unable to load menu from Firebase."
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    items,
    loading,
    error,
    setError,
  };
}
