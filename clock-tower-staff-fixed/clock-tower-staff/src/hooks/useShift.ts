"use client";
import { useState } from "react";
export function useShift() {
  const [open, setOpen] = useState(true);
  return { open, openShift: () => setOpen(true), closeShift: () => setOpen(false) };
}
