import React from "react";
import "../rooms/room.css";

export default function RoomModal({
  open,
  title = "Room",
  children,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="room-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="room-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="room-modal-head">
          <div>
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}