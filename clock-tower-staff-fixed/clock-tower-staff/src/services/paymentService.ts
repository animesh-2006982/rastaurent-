import {
  createDocument,
  getCollection,
  orderBy,
} from "@/firebase/firestore";

import type { Payment } from "@/types/payment";

export async function getPayments() {
  return getCollection<Payment>("payments", [
    orderBy("createdAt", "desc"),
  ]);
}

export async function createPayment(
  payment: Omit<Payment, "id">
) {
  return createDocument("payments", payment);
}