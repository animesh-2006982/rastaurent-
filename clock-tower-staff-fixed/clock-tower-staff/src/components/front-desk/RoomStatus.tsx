"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";

import {
  getRooms,
  updateRoomStatus,
} from "../../services/front-desk/roomStatusService";

type Staff = {
  id?: string;
  uid?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  branchId?: string;
};

type RoomStatusProps = {
  currentStaff?: Staff | null;
  branchId?: string;
};

type Room = {
  id?: string;
  roomId?: string;
  roomNumber?: string;
  number?: string;
  name?: string;
  roomName?: string;
  type?: string;
  category?: string;
  status?: string;
  housekeepingStatus?: string;
  branchId?: string;
};

const STATUS_OPTIONS = [
  "Available",
  "Occupied",
  "Cleaning",
  "Reserved",
  "Maintenance",
];

export default function RoomStatus({
  currentStaff,
  branchId = "all",
}: RoomStatusProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getRooms(branchId);

      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Room status load error:", err);
      setError("Unable to load room status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [branchId]);

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return rooms;

    return rooms.filter((room) => {
      const roomNumber =
        room.roomNumber ||
        room.number ||
        room.id ||
        "";

      const name =
        room.name ||
        room.roomName ||
        "";

      const category =
        room.category ||
        room.type ||
        "";

      return (
        String(roomNumber)
          .toLowerCase()
          .includes(query) ||
        String(name)
          .toLowerCase()
          .includes(query) ||
        String(category)
          .toLowerCase()
          .includes(query)
      );
    });
  }, [rooms, search]);

  const handleStatusChange = async (
    room: Room,
    status: string
  ) => {
    const roomId = room.id || room.roomId;

    if (!roomId) return;

    try {
      setUpdatingId(roomId);
      setError("");

      await updateRoomStatus(
        roomId,
        status,
        currentStaff
      );

      setRooms((previous) =>
        previous.map((item) => {
          const id = item.id || item.roomId;

          return id === roomId
            ? {
                ...item,
                status,
              }
            : item;
        })
      );
    } catch (err) {
      console.error("Room status update error:", err);
      setError("Unable to update room status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClass = (status?: string) => {
    return String(status || "Available")
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  return (
    <div className="front-desk-section">
      <div className="front-desk-section-head">
        <div>
          <h3>Room Status</h3>
          <p>
            View and update the current status of hotel rooms.
          </p>
        </div>

        <button
          type="button"
          className="front-desk-refresh"
          onClick={loadRooms}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={16} className="fd-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </div>

      <div className="front-desk-toolbar">
        <div className="front-desk-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search room..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
      </div>

      {error && (
        <div className="front-desk-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="front-desk-loading">
          <Loader2 size={24} className="fd-spin" />
          <span>Loading rooms...</span>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="front-desk-empty">
          <BedDouble size={34} />
          <h4>No rooms found</h4>
          <p>
            No rooms match the current search or branch.
          </p>
        </div>
      ) : (
        <div className="front-desk-room-grid">
          {filteredRooms.map((room) => {
            const roomId =
              room.id ||
              room.roomId ||
              room.roomNumber ||
              "";

            const roomNumber =
              room.roomNumber ||
              room.number ||
              room.id ||
              "—";

            const roomName =
              room.name ||
              room.roomName ||
              room.category ||
              room.type ||
              "Room";

            const currentStatus =
              room.status || "Available";

            return (
              <article
                className="front-desk-room-card"
                key={roomId}
              >
                <div className="front-desk-room-card-top">
                  <div className="front-desk-room-icon">
                    <BedDouble size={21} />
                  </div>

                  <span
                    className={`front-desk-status ${getStatusClass(
                      currentStatus
                    )}`}
                  >
                    {currentStatus}
                  </span>
                </div>

                <div className="front-desk-room-number">
                  Room {roomNumber}
                </div>

                <div className="front-desk-room-name">
                  {roomName}
                </div>

                <label className="front-desk-field-label">
                  Change status
                </label>

                <select
                  value={currentStatus}
                  disabled={updatingId === roomId}
                  onChange={(event) =>
                    handleStatusChange(
                      room,
                      event.target.value
                    )
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ))}
                </select>

                {updatingId === roomId && (
                  <div className="front-desk-updating">
                    <Loader2
                      size={14}
                      className="fd-spin"
                    />
                    Updating...
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}