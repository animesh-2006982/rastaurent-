import {
  getCollection,
  updateDocument,
} from "@/firebase/firestore";

import type { RestaurantTable, TableStatus } from "@/types/table";

export async function getTables() {
  return getCollection<RestaurantTable>("tables");
}

export async function updateTableStatus(
  id: string,
  status: TableStatus,
  currentOrderId?: string
) {
  return updateDocument("tables", id, {
    status,
    currentOrderId: currentOrderId || null,
  });
}