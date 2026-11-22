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

const roomsRef = collection(
  db,
  "rooms"
);

export async function getRooms() {
  const snapshot =
    await getDocs(roomsRef);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function addRoom(data) {
  return addDoc(roomsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRoom(
  id,
  data
) {
  return updateDoc(
    doc(db, "rooms", id),
    {
      ...data,
      updatedAt: serverTimestamp(),
    }
  );
}

export async function deleteRoom(id) {
  return deleteDoc(
    doc(db, "rooms", id)
  );
}