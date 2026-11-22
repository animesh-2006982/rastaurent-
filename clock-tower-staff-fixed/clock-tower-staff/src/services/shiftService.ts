import {
  createDocument,
  getCollection,
  updateDocument,
  where,
} from "@/firebase/firestore";

import type { CashShift } from "@/types/shift";

export async function getOpenShift(employeeId: string) {
  const shifts = await getCollection<CashShift>(
    "shifts",
    [
      where("employeeId", "==", employeeId),
      where("status", "==", "Open"),
    ]
  );

  return shifts[0] || null;
}

export async function openShift(
  shift: Omit<CashShift, "id">
) {
  return createDocument("shifts", shift);
}

export async function closeShift(
  id: string,
  actualCash: number,
  difference: number
) {
  return updateDocument("shifts", id, {
    actualCash,
    difference,
    status: "Closed",
    closedAt: new Date(),
  });
}