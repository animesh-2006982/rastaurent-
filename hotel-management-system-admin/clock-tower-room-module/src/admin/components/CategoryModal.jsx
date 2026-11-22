import React from "react";
import RoomModal from "./RoomModal";
export default function CategoryModal(props) {
  return <RoomModal {...props} title={props.title || "Room Category"}>{props.children}</RoomModal>;
}
