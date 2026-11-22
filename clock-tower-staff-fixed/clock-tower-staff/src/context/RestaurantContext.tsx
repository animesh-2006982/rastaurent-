
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/firebase/config";

import {
  employees as initialEmployees,
  restaurantDefaults,
} from "@/data/mock";

import type {
  FoodCategory,
  FoodItem,
} from "@/types/menu";

import type { Employee } from "@/types/employee";
import type { RestaurantTable } from "@/types/table";

type RestaurantSettings =
  typeof restaurantDefaults;

type RestaurantContextType = {
  foods: FoodItem[];
  categories: FoodCategory[];
  tables: RestaurantTable[];
  employees: Employee[];
  settings: RestaurantSettings;

  update: (
    patch: Partial<RestaurantSettings>
  ) => void;

  updateFood: (
    id: string,
    patch: Partial<FoodItem>
  ) => void;

  addFood: (food: FoodItem) => void;
};

const RestaurantContext =
  createContext<
    RestaurantContextType | undefined
  >(undefined);

export function RestaurantProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [foods, setFoods] =
    useState<FoodItem[]>([]);

  const [tables, setTables] =
    useState<RestaurantTable[]>([]);

  const [settings, setSettings] =
    useState<RestaurantSettings>(
      restaurantDefaults
    );

  /* =========================================
     FIREBASE PRODUCTS - REALTIME LISTENER
     ========================================= */

  useEffect(() => {
    const productsRef = collection(
      db,
      "products"
    );

    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const firebaseFoods: FoodItem[] =
          snapshot.docs
            .map((productDoc) => {
              const data = productDoc.data();

              return {
                id: productDoc.id,

                name: String(
                  data.name ?? ""
                ),

                categoryId: String(
                  data.categoryId ??
                    data.category ??
                    "other"
                ),

                categoryName:
                  data.categoryName != null
                    ? String(data.categoryName)
                    : undefined,

                // Supports description and desc
                description: String(
                  data.description ??
                    data.desc ??
                    ""
                ),

                price: Number(
                  data.price ?? 0
                ),

                // Supports imageUrl, image and img
                imageUrl:
                  data.imageUrl != null
                    ? String(data.imageUrl)
                    : data.image != null
                      ? String(data.image)
                      : data.img != null
                        ? String(data.img)
                        : undefined,

                available:
                  data.available !== false,

                active:
                  data.active !== false,

                createdAt: data.createdAt,

                updatedAt: data.updatedAt,
              } as FoodItem;
            })
            .filter(
              (food) =>
                food.active !== false &&
                food.available !== false
            );

        setFoods(firebaseFoods);
      },
      (error) => {
        console.error(
          "Firebase products listener error:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================================
     FIREBASE TABLES - REALTIME LISTENER
     ========================================= */

  useEffect(() => {
    const tablesRef = collection(
      db,
      "tables"
    );

    const unsubscribe = onSnapshot(
      tablesRef,
      (snapshot) => {
        const firebaseTables: RestaurantTable[] =
          snapshot.docs
            .map((tableDoc) => {
              const data = tableDoc.data();

              const tableValue =
                data.number ??
                data.tableNumber ??
                data.name ??
                0;

              const match = String(
                tableValue
              ).match(/\d+/);

              const tableNumber = match
                ? Number(match[0])
                : 0;

              const rawStatus = String(
                data.status ?? "Available"
              );

              const status =
                rawStatus === "Occupied"
                  ? "Occupied"
                  : rawStatus === "Reserved"
                    ? "Reserved"
                    : "Available";

              return {
                id: tableDoc.id,

                number: tableNumber,

                seats: Number(
                  data.seats ??
                    data.capacity ??
                    4
                ),

                status,

                active:
                  data.active !== false,

                currentOrderId:
                  data.currentOrderId != null
                    ? String(data.currentOrderId)
                    : data.orderId != null
                      ? String(data.orderId)
                      : undefined,
              } as RestaurantTable;
            })
            .filter(
              (table) =>
                table.active !== false
            )
            .sort(
              (a, b) =>
                a.number - b.number
            );

        setTables(firebaseTables);
      },
      (error) => {
        console.error(
          "Firebase tables listener error:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================================
     CATEGORIES FROM FIREBASE PRODUCTS
     ========================================= */

  const categories =
    useMemo<FoodCategory[]>(() => {
      const categoryMap = new Map<
        string,
        FoodCategory
      >();

      foods.forEach((food) => {
        if (!categoryMap.has(food.categoryId)) {
          categoryMap.set(
            food.categoryId,
            {
              id: food.categoryId,

              name:
                food.categoryName ||
                food.categoryId,

              active: true,
            }
          );
        }
      });

      return Array.from(
        categoryMap.values()
      );
    }, [foods]);

  /* =========================================
     UPDATE FOOD - SAVE TO FIRESTORE
     ========================================= */

  const updateFood = (
    id: string,
    patch: Partial<FoodItem>
  ) => {
    if (!id) {
      console.error(
        "Cannot update product: Product ID is missing."
      );
      return;
    }

    const productRef = doc(
      db,
      "products",
      id
    );

    const {
      id: ignoredId,
      ...updateData
    } = patch;

    void ignoredId;

    updateDoc(productRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    }).catch((error) => {
      console.error(
        "Firebase product update error:",
        error
      );
    });
  };

  /* =========================================
     ADD FOOD - SAVE TO FIRESTORE
     ========================================= */

  const addFood = (food: FoodItem) => {
    if (!food.id) {
      console.error(
        "Cannot add product: Product ID is missing."
      );
      return;
    }

    const productRef = doc(
      db,
      "products",
      food.id
    );

    const productData = {
      ...food,
      createdAt:
        food.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    setDoc(
      productRef,
      productData
    ).catch((error) => {
      console.error(
        "Firebase product creation error:",
        error
      );
    });
  };

  /* =========================================
     CONTEXT VALUE
     ========================================= */

  const value =
    useMemo<RestaurantContextType>(
      () => ({
        foods,

        categories,

        tables,

        employees: initialEmployees,

        settings,

        update: (patch) => {
          setSettings((current) => ({
            ...current,
            ...patch,
          }));
        },

        updateFood,

        addFood,
      }),
      [
        foods,
        categories,
        tables,
        settings,
      ]
    );

  return (
    <RestaurantContext.Provider
      value={value}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

/* =========================================
   CUSTOM HOOK
   ========================================= */

export function useRestaurant() {
  const context = useContext(
    RestaurantContext
  );

  if (!context) {
    throw new Error(
      "useRestaurant must be used inside RestaurantProvider"
    );
  }

  return context;
}

export default RestaurantContext;
