import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "@/firebase/config";
import { createDocumentWithId, getDocument } from "@/firebase/firestore";
import type { StaffUser, UserRole } from "@/types/restaurant";

export async function loginStaff(
  email: string,
  password: string
): Promise<StaffUser> {
  const result = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = await getDocument<StaffUser>(
    "employees",
    result.user.uid
  );

  if (!user) {
    await signOut(auth);
    throw new Error("Staff profile not found.");
  }

  if (user.active === false) {
    await signOut(auth);
    throw new Error("This staff account is inactive.");
  }

  return user;
}

export async function registerStaff(
  name: string,
  email: string,
  password: string,
  role: UserRole
) {
  const result = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await updateProfile(result.user, {
    displayName: name,
  });

  const staff: StaffUser = {
    uid: result.user.uid,
    name,
    email,
    role,
    active: true,
  };

  await createDocumentWithId(
    "employees",
    result.user.uid,
    staff
  );

  return staff;
}

export async function logoutStaff() {
  await signOut(auth);
}