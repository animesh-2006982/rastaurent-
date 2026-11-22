import React from "react";
import RoomModal from "./RoomModal";

export default function CategoryModal({
  open,
  onClose,
  title = "Room Category",
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