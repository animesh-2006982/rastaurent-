import React, {
  useEffect,
  useState,
} from "react";

import {
  getRooms,
  updateRoom,
} from "../../services/roomService";

import "./room.css";

const states = [
  "Cleaning",
  "Available",
  "Maintenance",
  "Out of Service",
];

export default function Housekeeping() {
  const [rooms, setRooms] = useState([]);

  const load = async () => {
    try {
      setRooms(await getRooms());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (
    id,
    status
  ) => {
    try {
      await updateRoom(id, {
        status,
      });

      await load();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="room-page">
      <div className="room-page-head">
        <div>
          <span className="room-eyebrow">
            OPERATIONS
          </span>

          <h1>Housekeeping</h1>

          <p>
            Track cleaning, maintenance and room
            readiness.
          </p>
        </div>
      </div>

      <div className="room-panel">
        <div className="availability-grid">
          {rooms.map((room) => (
            <div
              className="availability-card"
              key={room.id}
            >
              <div>
                <b>
                  #{room.roomNumber || room.id}
                </b>

                <span>
                  {room.categoryName || "Room"}
                </span>
              </div>

              <div className="housekeeping-actions">
                {states.map((status) => (
                  <button
                    key={status}
                    className={`mini-status ${
                      room.status === status
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      updateStatus(
                        room.id,
                        status
                      )
                    }
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!rooms.length && (
          <div className="room-empty">
            No rooms configured.
          </div>
        )}
      </div>
    </section>
  );
}