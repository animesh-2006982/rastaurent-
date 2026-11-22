import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export async function createOrder(order) {
  const safeOrder = {
    ...order,
    status: order.status || "New",
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "orders"), safeOrder);

  return ref.id;
}

export function subscribeToOrders(callback, onError) {
  const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    },
    (error) => {
      console.error("Orders realtime listener error:", error);
      onError?.(error);
    }
  );
}