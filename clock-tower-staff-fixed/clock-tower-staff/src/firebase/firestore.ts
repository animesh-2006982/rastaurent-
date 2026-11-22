
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "./config";

export async function getCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const ref = collection(db, collectionName);

  const q = constraints.length
    ? query(ref, ...constraints)
    : query(ref);

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
    recordId: item.data().id || item.id,
  })) as T[];
}

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const ref = doc(db, collectionName, id);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    ...snapshot.data(),
    id: snapshot.id,
    recordId: snapshot.data().id || snapshot.id,
  } as T;
}

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: T
) {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createDocumentWithId<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: T
) {
  await setDoc(doc(db, collectionName, id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: T
) {
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(
  collectionName: string,
  id: string
) {
  await deleteDoc(doc(db, collectionName, id));
}

export function subscribeCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void,
  constraints: QueryConstraint[] = [],
  onError?: (error: Error) => void
) {
  const ref = collection(db, collectionName);

  const q = constraints.length
    ? query(ref, ...constraints)
    : query(ref);

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        ...item.data(),
        id: item.id,
        recordId: item.data().id || item.id,
      })) as T[];

      callback(data);
    },
    (error) => {
      console.error(
        `Firestore subscription failed for ${collectionName}:`,
        error
      );

      onError?.(error);
    }
  );
}

export {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit
};
