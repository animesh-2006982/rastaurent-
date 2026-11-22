import type { OrderStatus, OrderItem } from "./order";

export interface KitchenOrder {
  id: string;
  table: string;
  type: string;
  items: OrderItem[];
  status: OrderStatus;
  elapsed: string;
}
