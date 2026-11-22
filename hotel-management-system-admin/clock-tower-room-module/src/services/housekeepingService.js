import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export async function getHousekeepingTasks(status) {
  const ref = collection(db, "housekeeping");
  const snap = status ? await getDocs(query(ref, where("status", "==", status))) : await getDocs(ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
