import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export function subscribeToReviews(callback, onError) {
  const reviewsQuery = query(
    collection(db, "reviews"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    reviewsQuery,
    (snapshot) => {
      callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    },
    (error) => onError?.(error)
  );
}

export async function createReview(review) {
  const ref = await addDoc(collection(db, "reviews"), {
    ...review,
    rating: Number(review.rating || 0),
    createdAt: serverTimestamp(),
  });

  return ref.id;
}
