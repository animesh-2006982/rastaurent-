import React, {
  useEffect,
  useState,
} from "react";

import {
  getRoomBookings,
  updateRoomBooking,
} from "../../services/roomBookingService";

import "./room.css";

export default function RoomBookings() {
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      setItems(await getRoomBookings());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (
    id,
    value
  ) => {
    try {
      await updateRoomBooking(id, {
        status: value,
      });

      await load();
    } catch (error) {
      console.error(error);
      alert("Could not update booking.");
    }
  };

  return (
    <section className="room-page">
      <div className="room-page-head">
        <div>
          <span className="room-eyebrow">
            ROOMS & STAY
          </span>

          <h1>Room Bookings</h1>

          <p>
            Manage reservations received from the
            public website and front desk.
          </p>
        </div>

        <button
          className="room-btn room-btn-outline"
          onClick={load}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="room-panel">
        <div className="room-table-wrap">
          <table className="room-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {items.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    #
                    {booking.bookingId ||
                      booking.id.slice(0, 8)}
                  </td>

                  <td>
                    {booking.guestName ||
                      "Guest"}

                    <small>
                      {booking.phone || ""}
                    </small>
                  </td>

                  <td>
                    {booking.roomNumber || "—"}
                  </td>

                  <td>
                    {booking.checkIn || "—"}
                  </td>

                  <td>
                    {booking.checkOut || "—"}
                  </td>

                  <td>
                    {booking.guests || 2}
                  </td>

                  <td>
                    ₹
                    {Number(
                      booking.totalAmount ||
                        booking.amount ||
                        0
                    ).toLocaleString("en-IN")}
                  </td>

                  <td>
                    <select
                      className="status-select"
                      value={
                        booking.status ||
                        "Pending"
                      }
                      onChange={(event) =>
                        updateStatus(
                          booking.id,
                          event.target.value
                        )
                      }
                    >
                      {[
                        "Pending",
                        "Confirmed",
                        "Checked In",
                        "Checked Out",
                        "Cancelled",
                        "No Show",
                      ].map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!items.length && (
          <div className="room-empty">
            No room bookings found.
          </div>
        )}
      </div>
    </section>
  );
}