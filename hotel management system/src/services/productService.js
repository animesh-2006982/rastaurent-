import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export function subscribeToProducts(callback, onError) {
  const productsQuery = query(collection(db, "products"), orderBy("name"));

  return onSnapshot(
    productsQuery,
    (snapshot) => {
      const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(rows);
    },
    (error) => onError?.(error)
  );
}
