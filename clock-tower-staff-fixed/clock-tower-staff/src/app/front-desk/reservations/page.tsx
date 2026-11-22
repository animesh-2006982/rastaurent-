"use client";

import React, { useEffect, useState } from "react";
import Reservations from "../../../components/front-desk/Reservations";

type Staff = {
  id?: string;
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  branchId?: string;
  phone?: string;
  active?: boolean;
};

export default function ReservationsPage() {
  const [currentStaff, setCurrentStaff] =
    useState<Staff | null>(null);

  const [branchId, setBranchId] =
    useState("all");

  useEffect(() => {
    try {
      const savedStaff =
        localStorage.getItem(
          "kaveri-current-staff"
        );

      if (savedStaff) {
        const staff = JSON.parse(savedStaff);

        setCurrentStaff(staff);

        setBranchId(
          staff?.branchId || "all"
        );
      }
    } catch (error) {
      console.error(
        "Unable to load current staff:",
        error
      );
    }
  }, []);

  return (
    <Reservations
      currentStaff={currentStaff}
      branchId={branchId}
    />
  );
}