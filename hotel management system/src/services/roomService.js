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

const roomsRef = collection(db, "rooms");
const bookingsRef = collection(db, "roomBookings");

export async function getRooms() {
  const snapshot = await getDocs(roomsRef);

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

export async function updateRoom(id, data) {
  return updateDoc(doc(db, "rooms", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRoom(id) {
  return deleteDoc(doc(db, "rooms", id));
}

/* =========================
   ROOM BOOKING
========================= */

export async function createRoomBooking(data) {
  return addDoc(bookingsRef, {
    ...data,
    status: "Pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* =========================
   UNAVAILABLE ROOMS
========================= */

export async function getUnavailableRoomIds(checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    return [];
  }

  const snapshot = await getDocs(bookingsRef);

  const unavailableIds = snapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .filter((booking) => {
      if (!booking.roomId) return false;

      if (
        booking.status === "Cancelled" ||
        booking.status === "Checked Out" ||
        booking.status === "No Show"
      ) {
        return false;
      }

      if (!booking.checkIn || !booking.checkOut) {
        return false;
      }

      const existingCheckIn = new Date(
        `${booking.checkIn}T12:00:00`
      );

      const existingCheckOut = new Date(
        `${booking.checkOut}T12:00:00`
      );

      const requestedCheckIn = new Date(
        `${checkIn}T12:00:00`
      );

      const requestedCheckOut = new Date(
        `${checkOut}T12:00:00`
      );

      return (
        requestedCheckIn < existingCheckOut &&
        requestedCheckOut > existingCheckIn
      );
    })
    .map((booking) => booking.roomId);

  return [...new Set(unavailableIds)];
}