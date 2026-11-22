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
export async function getHousekeepingRooms(
  branchId: string = "all"
) {
  const ref = collection(
    db,
    "rooms"
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

export async function updateHousekeepingStatus(
  roomId: string,
  status: string,
  staff: any,
  branchId: string = "all"
) {
  if (!roomId) {
    throw new Error(
      "Room ID is required."
    );
  }

  const roomRef = doc(
    db,
    "rooms",
    roomId
  );

  await updateDoc(roomRef, {
    housekeepingStatus: status,

    status:
      status === "Clean"
        ? "Available"
        : status === "Maintenance"
        ? "Maintenance"
        : "Cleaning",

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