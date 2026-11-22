import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Hotel, Users } from "lucide-react";
import RoomCard from "./RoomCard";
import RoomSearch from "./RoomSearch";
import RoomBookingModal from "./RoomBookingModal";

import {
  getRooms,
  getUnavailableRoomIds,
} from "../services/roomService";

import { getRoomCategories } from "../services/roomCategoryService";

import "./rooms.css";

const formatDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const countNights = (checkIn, checkOut) => {
  const start = new Date(`${checkIn}T12:00:00`);
  const end = new Date(`${checkOut}T12:00:00`);

  const diff = end.getTime() - start.getTime();

  return diff > 0 ? Math.ceil(diff / 86400000) : 0;
};

export default function RoomsPage({ nav, hotel = {} }) {
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unavailableIds, setUnavailableIds] = useState([]);

  const [booking, setBooking] = useState({
    checkIn: formatDate(1),
    checkOut: formatDate(2),
    guests: "2",
    category: "All",
  });

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const nights = countNights(
    booking.checkIn,
    booking.checkOut
  );

  /* =========================
     LOAD ROOMS + CATEGORIES
  ========================= */

  const loadRooms = async () => {
    setLoading(true);
    setMessage("");

    try {
      const [liveRooms, liveCategories, blockedIds] =
        await Promise.all([
          getRooms(),
          getRoomCategories(),
          getUnavailableRoomIds(
            booking.checkIn,
            booking.checkOut
          ),
        ]);

      setRooms(liveRooms || []);
      setCategories(
        (liveCategories || []).filter(
          (category) => category.active !== false
        )
      );
      setUnavailableIds(blockedIds || []);
    } catch (error) {
      console.error("Room loading error:", error);

      setMessage(
        error?.message || "Unable to load rooms."
      );

      setRooms([]);
      setCategories([]);
      setUnavailableIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [booking.checkIn, booking.checkOut]);

  /* =========================
     CATEGORY OPTIONS
  ========================= */

  const categoryOptions = useMemo(() => {
    return [
      "All",
      ...categories
        .map((category) => category.name)
        .filter(Boolean),
    ];
  }, [categories]);

  /* =========================
     PREPARE PUBLIC ROOM DATA
  ========================= */

  const publicRooms = useMemo(() => {
    return rooms.map((room) => {
      const category = categories.find(
        (item) => item.id === room.categoryId
      );

      return {
        ...room,

        name:
          room.name ||
          room.roomNumber ||
          category?.name ||
          "Room",

        category:
          room.category ||
          room.categoryName ||
          category?.name ||
          "Room",

        price:
          Number(room.price) ||
          Number(category?.price) ||
          0,

        guests:
          Number(room.guests) ||
          Number(room.maxGuests) ||
          Number(category?.maxGuests) ||
          2,

        description:
          room.description ||
          category?.description ||
          room.notes ||
          "Comfortable stay with restaurant access and essential guest amenities.",

        image:
          room.image ||
          category?.image ||
          "",

        ac:
          typeof room.ac === "boolean"
            ? room.ac
            : false,
      };
    });
  }, [rooms, categories]);

  /* =========================
     FILTER ROOMS
  ========================= */

  const filteredRooms = useMemo(() => {
    return publicRooms.filter((room) => {
      const status = String(
        room.status || "Available"
      ).toLowerCase();

      // Only available rooms
      if (status !== "available") {
        return false;
      }

      // Remove already booked rooms
      if (unavailableIds.includes(room.id)) {
        return false;
      }

      // Category filter
      if (
        booking.category !== "All" &&
        String(room.category).toLowerCase() !==
          String(booking.category).toLowerCase()
      ) {
        return false;
      }

      // Guest capacity
      if (
        Number(room.guests || 1) <
        Number(booking.guests || 1)
      ) {
        return false;
      }

      return true;
    });
  }, [
    publicRooms,
    unavailableIds,
    booking.category,
    booking.guests,
  ]);

  return (
    <main className="rooms-page">
      <div className="rooms-wrap">

        {/* HERO */}

        <header className="rooms-hero">
          <div>
            <span>RESTAURANT · ROOMS</span>

            <h1>
              Stay the night.
              <br />
              <em>Start with dinner.</em>
            </h1>

            <p>
              {hotel.name || "Our property"} combines
              dining and accommodation in one simple
              guest journey.
            </p>
          </div>

          <div className="rooms-hero-stats">

            <div>
              <CalendarDays size={19} />
              <strong>Flexible dates</strong>
            </div>

            <div>
              <Users size={19} />
              <strong>Guest based search</strong>
            </div>

            <div>
              <Hotel size={19} />
              <strong>Category wise rooms</strong>
            </div>

          </div>
        </header>

        {/* SEARCH */}

        <RoomSearch
          {...booking}
          categories={categoryOptions}
          onChange={(key, value) =>
            setBooking((current) => ({
              ...current,
              [key]: value,
            }))
          }
          onSearch={loadRooms}
        />

        {/* RESULT HEADER */}

        <div className="rooms-result-heading">
          <div>
            <span>AVAILABLE ROOMS</span>

            <h2>
              {filteredRooms.length} room
              {filteredRooms.length === 1
                ? ""
                : "s"} available
            </h2>
          </div>

          <p>
            {nights || 0} night
            {nights === 1 ? "" : "s"} selected
          </p>
        </div>

        {/* STATUS */}

        {loading && (
          <div className="rooms-status">
            Loading rooms…
          </div>
        )}

        {!loading && message && (
          <div className="rooms-status rooms-status-error">
            {message}
          </div>
        )}

        {!loading &&
          !message &&
          filteredRooms.length === 0 && (
            <div className="rooms-status">
              No room available for these dates and
              guest count.
            </div>
          )}

        {/* ROOMS */}

        {!loading &&
          !message &&
          filteredRooms.length > 0 && (
            <div className="rooms-grid">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  nights={nights || 1}
                  onBook={setSelectedRoom}
                />
              ))}
            </div>
          )}

        {/* BOOKING MODAL */}

        {selectedRoom && (
          <RoomBookingModal
            room={selectedRoom}
            booking={booking}
            onClose={() => setSelectedRoom(null)}
            onBooked={() => {
              setSelectedRoom(null);
              setMessage(
                "Booking confirmed successfully."
              );
              loadRooms();
            }}
          />
        )}

      </div>
    </main>
  );
}