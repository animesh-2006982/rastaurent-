import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/config";

export async function getGuests(
  branchId: string = "all"
) {
  const ref = collection(
    db,
    "guests"
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