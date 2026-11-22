import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

const categoriesRef = collection(
  db,
  "roomCategories"
);

export async function getRoomCategories() {
  const snapshot = await getDocs(categoriesRef);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function addRoomCategory(data) {
  return addDoc(categoriesRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRoomCategory(id, data) {
  return updateDoc(
    doc(db, "roomCategories", id),
    {
      ...data,
      updatedAt: serverTimestamp(),
    }
  );
}

export async function deleteRoomCategory(id) {
  return deleteDoc(
    doc(db, "roomCategories", id)
  );
}