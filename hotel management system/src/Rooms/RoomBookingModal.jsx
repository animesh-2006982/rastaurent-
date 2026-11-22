import React, { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { createRoomBooking } from "../services/roomService";
import "./rooms.css";

export default function RoomBookingModal({
  room,
  booking,
  onClose,
  onBooked,
}) {
  const [guest, setGuest] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!room) return null;

  const calculateNights = () => {
    const start = new Date(`${booking.checkIn}T12:00:00`);
    const end = new Date(`${booking.checkOut}T12:00:00`);

    const diff = end.getTime() - start.getTime();

    return diff > 0 ? Math.ceil(diff / 86400000) : 1;
  };

  const nights = calculateNights();
  const pricePerNight = Number(room.price || 0);
  const totalAmount = pricePerNight * nights;

  const submit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await createRoomBooking({
        roomId: room.id,
        roomName: room.name,
        roomNumber: room.roomNumber || "",
        category: room.category,
        categoryId: room.categoryId || "",

        checkIn: booking.checkIn,
        checkOut: booking.checkOut,

        guests: Number(booking.guests || 1),

        pricePerNight,
        nights,
        totalAmount,

        name: guest.name,
        phone: guest.phone,
        email: guest.email,
      });

      onBooked?.(result);
      onClose?.();
    } catch (err) {
      console.error("Room booking error:", err);

      setError(
        err?.message ||
          "Booking failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="room-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="room-booking-modal">

        <button
          type="button"
          className="room-modal-close"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <span>RESERVE YOUR ROOM</span>

        <h2>{room.name}</h2>

        <p>
          {booking.checkIn} → {booking.checkOut} ·{" "}
          {booking.guests} guest(s)
        </p>

        <div>
          <strong>
            ₹{pricePerNight.toLocaleString("en-IN")}
          </strong>
          {" × "}
          {nights} night{nights === 1 ? "" : "s"}

          <br />

          <strong>
            Total: ₹{totalAmount.toLocaleString("en-IN")}
          </strong>
        </div>

        <form onSubmit={submit}>

          <label>
            Guest name
            <input
              required
              value={guest.name}
              onChange={(e) =>
                setGuest({
                  ...guest,
                  name: e.target.value,
                })
              }
            />
          </label>

          <label>
            Phone
            <input
              required
              type="tel"
              value={guest.phone}
              onChange={(e) =>
                setGuest({
                  ...guest,
                  phone: e.target.value,
                })
              }
            />
          </label>

          <label>
            Email
            <input
              type="email"
              required
              value={guest.email}
              onChange={(e) =>
                setGuest({
                  ...guest,
                  email: e.target.value,
                })
              }
            />
          </label>

          {error && (
            <div className="room-booking-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Saving booking..."
              : "Confirm Booking"}

            <ChevronRight size={16} />
          </button>

        </form>
      </div>
    </div>
  );
}