"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import StaffLayout from "@/components/layout/StaffLayout";

export default function FrontDeskLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  let active = "Front Desk";

  if (pathname.includes("/room-status")) {
    active = "Room Status";
  } else if (pathname.includes("/reservations")) {
    active = "Reservations";
  } else if (pathname.includes("/check-in")) {
    active = "Check-in";
  } else if (pathname.includes("/check-out")) {
    active = "Check-out";
  } else if (pathname.includes("/guests")) {
    active = "Guest List";
  } else if (pathname.includes("/housekeeping")) {
    active = "Housekeeping";
  }

  return (
    <StaffLayout active={active}>
      {children}
    </StaffLayout>
  );
}