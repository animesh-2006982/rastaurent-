export type PaymentMethod = "Cash" | "UPI" | "Card";

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  status: "Paid" | "Pending" | "Refunded";
  receivedBy: string;
  createdAt?: unknown;
}