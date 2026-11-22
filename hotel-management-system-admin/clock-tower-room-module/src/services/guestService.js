import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const ref = collection(db, "guests");

export async function getGuests() {
  const snap = await getDocs(ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addGuest(data) {
  return addDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
