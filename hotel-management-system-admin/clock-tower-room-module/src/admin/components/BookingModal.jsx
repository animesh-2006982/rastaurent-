import React from "react";
import RoomModal from "./RoomModal";
export default function BookingModal(props) {
  return <RoomModal {...props} title={props.title || "Room Booking"}>{props.children}</RoomModal>;
}
