import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

const guestsRef =
  collection(
    db,
    "guests"
  );

export async function getGuests() {
  const snapshot =
    await getDocs(guestsRef);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function addGuest(
  data
) {
  return addDoc(guestsRef, {
    ...data,
    createdAt:
      serverTimestamp(),
    updatedAt:
      serverTimestamp(),
  });
}