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

export async function getCheckedInGuests(
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
        ),
        where(
          "status",
          "==",
          "Checked-in"
        )
      )
    );
  } else {
    snapshot = await getDocs(
      query(
        ref,
        where(
          "status",
          "==",
          "Checked-in"
        )
      )
    );
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function checkOutGuest(
  guest: any,
  staff: any,
  branchId: string = "all"
) {
  if (!guest?.id) {
    throw new Error(
      "Booking ID is required."
    );
  }

  const bookingRef = doc(
    db,
    "roomBookings",
    guest.id
  );

  await updateDoc(bookingRef, {
    status: "Checked-out",
    checkedOutAt: serverTimestamp(),
    checkedOutBy:
      staff?.uid ||
      staff?.id ||
      staff?.email ||
      "staff",
    checkedOutByName:
      staff?.name ||
      staff?.email ||
      "Staff",
    updatedAt: serverTimestamp(),
    branchId,
  });

  const roomId =
    guest.roomId ||
    guest.roomID ||
    guest.roomDocId;

  if (roomId) {
    const roomRef = doc(
      db,
      "rooms",
      roomId
    );

    await updateDoc(roomRef, {
      status: "Cleaning",
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