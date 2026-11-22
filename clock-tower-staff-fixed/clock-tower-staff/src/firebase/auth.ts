import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "./config";

import type {
  AuthUser,
  EmployeeRole,
} from "@/types/employee";

export async function signInWithEmployee(
  employeeId: string,
  pin: string,
): Promise<AuthUser | null> {
  const cleanId = employeeId
    .trim()
    .toUpperCase();

  const cleanPin = pin.trim();

  if (!cleanId || !cleanPin) {
    return null;
  }

  try {
    const snapshot = await getDocs(
      collection(db, "staff"),
    );

    console.log(
      "Firebase staff documents:",
      snapshot.size,
    );

    const staffDoc = snapshot.docs.find((doc) => {
      const data = doc.data();

      const firebaseEmployeeId = String(
        data.employeeId || "",
      )
        .trim()
        .toUpperCase();

      const firebasePin = String(
        data.pin || "",
      ).trim();

      const active =
        data.active !== false;

      return (
        firebaseEmployeeId === cleanId &&
        firebasePin === cleanPin &&
        active
      );
    });

    if (!staffDoc) {
      console.error(
        "Staff login failed:",
        {
          employeeId: cleanId,
          staffCount: snapshot.size,
        },
      );

      return null;
    }

    const data = staffDoc.data();

    const user: AuthUser = {
      id: staffDoc.id,

      employeeId: String(
        data.employeeId || cleanId,
      ),

      name: String(
        data.name || "",
      ),

      phone: String(
        data.phone ||
        data.email ||
        "",
      ),

      email: data.email
        ? String(data.email)
        : undefined,

      role: (
        data.role || "Waiter"
      ) as EmployeeRole,

      status:
        data.active === false
          ? "Inactive"
          : "Active",

      joinedAt: data.joinedAt
        ? String(data.joinedAt)
        : new Date().toISOString(),

      permissions:
        Array.isArray(data.permissions)
          ? data.permissions
          : [],

      loggedInAt:
        new Date().toISOString(),
    };

    console.log(
      "Staff login successful:",
      user.employeeId,
      user.role,
    );

    return user;

  } catch (error) {
    console.error(
      "FIREBASE STAFF LOGIN ERROR:",
      error,
    );

    return null;
  }
}

export async function signOutEmployee() {
  return true;
}