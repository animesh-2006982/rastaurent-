
export type OrderStatus =
  | "New"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "Out for Delivery"
  | "Delivered"
  | "Completed"
  | "Cancelled";

export type OrderType =
  | "Dine In"
  | "Takeaway"
  | "Delivery"
  | "Dine-in";

export interface OrderItem {
  menuItemId?: string;
  productId?: string;
  name: string;
  quantity: number;
  qty?: number;
  price: number;
  total?: number;
  notes?: string;
  img?: string;
}

export interface RestaurantOrder {
  id: string;
  orderNumber?: string;
  tableId?: string;
  table?: string;
  tableNumber?: string;

  customer?: string | {
    name?: string;
    phone?: string;
    address?: string;
  };

  customerName?: string;
  customerPhone?: string;
  phone?: string;

  type?: string;
  source?: string;
  channel?: string;
  orderType?: OrderType;

  items: OrderItem[];

  subtotal?: number;
  deliveryFee?: number;
  tax?: number;
  discount?: number;
  total: number;

  status: OrderStatus;

  paymentStatus?: string;
  paymentMethod?: string;
  createdBy?: string;

  createdAt?: any;
  updatedAt?: any;
}
