"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth } from "@/firebase/config";
import { getDocument } from "@/firebase/firestore";
import type { StaffUser } from "@/types/restaurant";

export function useAuth() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setFirebaseUser(currentUser);

        if (!currentUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const staff = await getDocument<StaffUser>(
            "employees",
            currentUser.uid
          );

          setUser(staff);
        } catch (error) {
          console.error("Failed to load staff profile:", error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    user,
    firebaseUser,
    loading,
  };
}