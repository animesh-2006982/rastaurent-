import React, { useEffect, useMemo, useState } from "react";
import { getRooms } from "../../services/roomService";
import { getRoomBookings } from "../../services/roomBookingService";
import "./room.css";

const STATUS = [
  "Available",
  "Occupied",
  "Reserved",
  "Cleaning",
  "Maintenance",
  "Out of Service",
];

export default function RoomDashboard() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [roomData, bookingData] = await Promise.all([
        getRooms(),
        getRoomBookings(),
      ]);

      setRooms(roomData);
      setBookings(bookingData);
    } catch (err) {
      console.error(err);
      setError(
        "Could not load room data. Check Firebase configuration and permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const result = Object.fromEntries(
      STATUS.map((status) => [status, 0])
    );

    rooms.forEach((room) => {
      const status = room.status || "Available";
      result[status] = (result[status] || 0) + 1;
    });

    return result;
  }, [rooms]);

  if (loading) {
    return (
      <section className="room-page">
        <div className="room-loading">
          Loading room dashboard...
        </div>
      </section>
    );
  }

  return (
    <section className="room-page">
      <div className="room-page-head">
        <div>
          <span className="room-eyebrow">ROOMS & STAY</span>
          <h1>Room Dashboard</h1>
          <p>
            Monitor rooms, occupancy and hotel operations from one place.
          </p>
        </div>

        <button
          className="room-btn room-btn-outline"
          onClick={load}
        >
          ↻ Refresh
        </button>
      </div>

      {error && <div className="room-alert">{error}</div>}

      <div className="room-stat-grid">
        <Stat
          title="Total Rooms"
          value={rooms.length}
          icon="▦"
        />

        <Stat
          title="Available"
          value={counts.Available || 0}
          icon="✓"
        />

        <Stat
          title="Occupied"
          value={counts.Occupied || 0}
          icon="●"
        />

        <Stat
          title="Reserved"
          value={counts.Reserved || 0}
          icon="◷"
        />

        <Stat
          title="Cleaning"
          value={counts.Cleaning || 0}
          icon="✦"
        />

        <Stat
          title="Maintenance"
          value={counts.Maintenance || 0}
          icon="⚒"
        />
      </div>

      <div className="room-panel">
        <div className="room-panel-head">
          <div>
            <h2>Room Status</h2>
            <p>Current status of every configured room.</p>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="room-empty">
            No rooms found. Add your first room from <b>Rooms</b>.
          </div>
        ) : (
          <div className="room-grid">
            {rooms.map((room) => (
              <div
                className="room-status-card"
                key={room.id}
              >
                <div className="room-status-top">
                  <span className="room-number">
                    #{room.roomNumber || room.id}
                  </span>

                  <span
                    className={`room-badge ${statusClass(
                      room.status
                    )}`}
                  >
                    {room.status || "Available"}
                  </span>
                </div>

                <h3>
                  {room.name ||
                    room.categoryName ||
                    "Room"}
                </h3>

                <p>
                  {room.floor
                    ? `${room.floor} • `
                    : ""}
                  {room.bedType || "Standard room"}
                </p>

                <div className="room-card-meta">
                  <span>
                    👤 {room.maxGuests || 2}
                  </span>

                  <span>
                    ₹
                    {Number(
                      room.price || 0
                    ).toLocaleString("en-IN")}
                    /night
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="room-panel">
        <div className="room-panel-head">
          <div>
            <h2>Recent Bookings</h2>
            <p>{bookings.length} booking record(s)</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="room-empty">
            No room bookings yet.
          </div>
        ) : (
          <div className="room-table-wrap">
            <table className="room-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Stay</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {bookings.slice(0, 8).map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      #
                      {booking.bookingId ||
                        booking.id.slice(0, 8)}
                    </td>

                    <td>
                      {booking.guestName || "Guest"}
                    </td>

                    <td>
                      {booking.roomNumber || "—"}
                    </td>

                    <td>
                      {booking.checkIn || "—"} →{" "}
                      {booking.checkOut || "—"}
                    </td>

                    <td>
                      <span
                        className={`room-badge ${bookingStatusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status || "Pending"}
                      </span>
                    </td>

                    <td>
                      ₹
                      {Number(
                        booking.totalAmount ||
                          booking.amount ||
                          0
                      ).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="room-stat-card">
      <div className="room-stat-icon">{icon}</div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function statusClass(status = "") {
  return `status-${status
    .toLowerCase()
    .replaceAll(" ", "-")}`;
}

function bookingStatusClass(status = "") {
  return `status-${status
    .toLowerCase()
    .replaceAll(" ", "-")}`;
}