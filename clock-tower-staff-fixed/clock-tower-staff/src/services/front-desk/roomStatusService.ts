import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "../../firebase/config";

export async function getRooms(
  branchId: string = "all"
) {
  const roomsRef = collection(
    db,
    "rooms"
  );

  let snapshot;

  if (branchId && branchId !== "all") {
    const q = query(
      roomsRef,
      where("branchId", "==", branchId)
    );

    snapshot = await getDocs(q);
  } else {
    snapshot = await getDocs(
      query(roomsRef)
    );
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function updateRoomStatus(
  roomId: string,
  status: string,
  staff: any,
  branchId: string = "all"
) {
  if (!roomId) {
    throw new Error("Room ID is required.");
  }

  const roomRef = doc(
    db,
    "rooms",
    roomId
  );

  await updateDoc(roomRef, {
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