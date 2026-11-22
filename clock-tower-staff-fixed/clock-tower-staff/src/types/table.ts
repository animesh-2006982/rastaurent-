export type TableStatus = "Available" | "Occupied" | "Reserved";

export interface RestaurantTable {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  active: boolean;
  currentOrderId?: string;
}