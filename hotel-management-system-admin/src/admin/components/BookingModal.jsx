import React from "react";
import RoomModal from "./RoomModal";

export default function BookingModal({
  open,
  onClose,
  title = "Room Booking",
  children,
}) {
  return (
    <RoomModal
      open={open}
      onClose={onClose}
      title={title}
    >
      {children}
    </RoomModal>
  );
}