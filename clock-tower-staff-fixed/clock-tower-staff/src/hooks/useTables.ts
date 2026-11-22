"use client";

import { useEffect, useState } from "react";
import { subscribeCollection } from "@/firebase/firestore";
import { updateTableStatus } from "@/services/tableService";

import type {
  RestaurantTable,
  TableStatus,
} from "@/types/table";

export function useTables() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeCollection<RestaurantTable>(
      "tables",
      (data) => {
        setTables(
          [...data].sort((a, b) => a.number - b.number)
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function changeStatus(
    id: string,
    status: TableStatus,
    orderId?: string
  ) {
    await updateTableStatus(id, status, orderId);
  }

  return {
    tables,
    loading,
    changeStatus,
  };
}