import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export function subscribeToSiteContent(callback, onError) {
  return onSnapshot(
    doc(db, "settings", "siteContent"),
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : {});
    },
    (error) => onError?.(error)
  );
}
