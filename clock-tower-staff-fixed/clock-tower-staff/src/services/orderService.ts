
import {
  createDocument,
  updateDocument,
} from "@/firebase/firestore";

import type {
  OrderStatus,
  RestaurantOrder,
} from "@/types/order";

export async function createOrder(
  order: Omit<RestaurantOrder, "id">
) {
  return createDocument("orders", order);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
) {
  return updateDocument(
    "orders",
    id,
    {
      status,
      updatedBy: "staff",
    } as any
  );
}

export async function updateOrder(
  id: string,
  data: Partial<RestaurantOrder>
) {
  return updateDocument(
    "orders",
    id,
    data as any
  );
}

