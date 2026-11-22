import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/config";

export async function getReservations(
  branchId: string = "all"
) {
  const ref = collection(
    db,
    "roomBookings"
  );

  let snapshot;

  if (branchId && branchId !== "all") {
    snapshot = await getDocs(
      query(
        ref,
        where(
          "branchId",
          "==",
          branchId
        )
      )
    );
  } else {
    snapshot = await getDocs(ref);
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function checkInGuest(
  booking: any,
  staff: any,
  branchId: string = "all"
) {
  if (!booking?.id) {
    throw new Error(
      "Booking ID is required."
    );
  }

  const bookingRef = doc(
    db,
    "roomBookings",
    booking.id
  );

  await updateDoc(bookingRef, {
    status: "Checked-in",
    checkedInAt: serverTimestamp(),
    checkedInBy:
      staff?.uid ||
      staff?.id ||
      staff?.email ||
      "staff",
    checkedInByName:
      staff?.name ||
      staff?.email ||
      "Staff",
    updatedAt: serverTimestamp(),
    branchId,
  });

  const roomId =
    booking.roomId ||
    booking.roomID ||
    booking.roomDocId;

  if (roomId) {
    const roomRef = doc(
      db,
      "rooms",
      roomId
    );

    await updateDoc(roomRef, {
      status: "Occupied",
      updatedAt: serverTimestamp(),
      updatedBy:
        staff?.uid ||
        staff?.id ||
        staff?.email ||
        "staff",
    });
  }

  return true;
}