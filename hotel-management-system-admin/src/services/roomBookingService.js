import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

const bookingsRef =
  collection(
    db,
    "roomBookings"
  );

const settingsRef = doc(
  db,
  "roomSettings",
  "general"
);

export async function getRoomBookings() {
  const snapshot =
    await getDocs(bookingsRef);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function addRoomBooking(
  data
) {
  return addDoc(bookingsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRoomBooking(
  id,
  data
) {
  return updateDoc(
    doc(
      db,
      "roomBookings",
      id
    ),
    {
      ...data,
      updatedAt: serverTimestamp(),
    }
  );
}

export async function getRoomSettings() {
  const snapshot =
    await getDoc(settingsRef);

  return snapshot.exists()
    ? snapshot.data()
    : null;
}

export async function saveRoomSettings(
  data
) {
  return setDoc(
    settingsRef,
    {
      ...data,
      updatedAt:
        serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}