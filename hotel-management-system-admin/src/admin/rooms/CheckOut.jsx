import React, {
  useEffect,
  useState,
} from "react";

import {
  getRoomBookings,
  updateRoomBooking,
} from "../../services/roomBookingService";

import {
  getRooms,
  updateRoom,
} from "../../services/roomService";

import "./room.css";

export default function CheckOut() {
  const [bookings, setBookings] = useState([]);

  const load = async () => {
    try {
      const data = await getRoomBookings();

      setBookings(
        data.filter(
          (booking) =>
            booking.status === "Checked In"
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const checkOut = async (booking) => {
    try {
      await updateRoomBooking(
        booking.id,
        {
          status: "Checked Out",
        }
      );

      const rooms = await getRooms();

      const room = rooms.find(
        (item) =>
          String(item.roomNumber) ===
          String(booking.roomNumber)
      );

      if (room) {
        await updateRoom(room.id, {
          status: "Cleaning",
        });
      }

      await load();
    } catch (error) {
      console.error(error);
      alert("Check-out failed.");
    }
  };

  return (
    <section className="room-page">
      <div className="room-page-head">
        <div>
          <span className="room-eyebrow">
            FRONT DESK
          </span>

          <h1>Check-out</h1>

          <p>
            Check out current guests and
            automatically send the room to cleaning.
          </p>
        </div>
      </div>

      <div className="room-card-grid">
        {bookings.map((booking) => (
          <div
            className="category-card compact-card"
            key={booking.id}
          >
            <div className="category-body">
              <div className="category-title-row">
                <h3>
                  {booking.guestName ||
                    "Guest"}
                </h3>

                <span className="room-badge status-occupied">
                  Checked In
                </span>
              </div>

              <p>
                Room #
                {booking.roomNumber || "—"} •
                Checkout{" "}
                {booking.checkOut || "—"}
              </p>

              <div className="category-meta">
                <span>
                  ₹
                  {Number(
                    booking.totalAmount ||
                      booking.amount ||
                      0
                  ).toLocaleString("en-IN")}
                </span>

                <span>
                  👤 {booking.guests || 2}
                </span>
              </div>

              <button
                className="room-btn room-btn-primary"
                onClick={() =>
                  checkOut(booking)
                }
              >
                Check Out
              </button>
            </div>
          </div>
        ))}
      </div>

      {!bookings.length && (
        <div className="room-empty room-panel">
          No guests currently checked in.
        </div>
      )}
    </section>
  );
}