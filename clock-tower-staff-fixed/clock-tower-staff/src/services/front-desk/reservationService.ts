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

export async function updateReservationStatus(
  reservationId: string,
  status: string,
  staff: any,
  branchId: string = "all"
) {
  if (!reservationId) {
    throw new Error(
      "Reservation ID is required."
    );
  }

  const ref = doc(
    db,
    "roomBookings",
    reservationId
  );

  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
    updatedBy:
      staff?.uid ||
      staff?.id ||
      staff?.email ||
      "staff",
    updatedByName:
      staff?.name ||
      staff?.email ||
      "Staff",
    branchId,
  });

  return true;
}