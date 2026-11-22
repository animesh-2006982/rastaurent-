"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";

import {
  getHousekeepingRooms,
  updateHousekeepingStatus,
} from "../../services/front-desk/housekeepingService";

type Staff = {
  id?: string;
  uid?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  branchId?: string;
};

type HousekeepingProps = {
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
  category?: string;
  type?: string;
  status?: string;
  housekeepingStatus?: string;
};

const HOUSEKEEPING_STATUS = [
  "Cleaning",
  "Clean",
  "Inspected",
  "Maintenance",
];

export default function Housekeeping({
  currentStaff,
  branchId = "all",
}: HousekeepingProps) {
  const [rooms, setRooms] = useState<Room[]>(
    []
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] =
    useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getHousekeepingRooms(branchId);

      setRooms(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Housekeeping load error:",
        err
      );
      setError(
        "Unable to load housekeeping rooms."
      );
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
      const number =
        room.roomNumber ||
        room.number ||
        room.id ||
        "";

      const name =
        room.name ||
        room.roomName ||
        room.category ||
        room.type ||
        "";

      return (
        String(number)
          .toLowerCase()
          .includes(query) ||
        String(name)
          .toLowerCase()
          .includes(query)
      );
    });
  }, [rooms, search]);

  const handleStatusChange = async (
    room: Room,
    status: string
  ) => {
    const roomId =
      room.id || room.roomId;

    if (!roomId) return;

    try {
      setUpdatingId(roomId);
      setError("");

      await updateHousekeepingStatus(
        roomId,
        status,
        currentStaff
      );

      setRooms((previous) =>
        previous.map((item) => {
          const id =
            item.id || item.roomId;

          return id === roomId
            ? {
                ...item,
                housekeepingStatus: status,
                status:
                  status === "Clean"
                    ? "Available"
                    : status ===
                      "Maintenance"
                    ? "Maintenance"
                    : "Cleaning",
              }
            : item;
        })
      );
    } catch (err) {
      console.error(
        "Housekeeping status error:",
        err
      );
      setError(
        "Unable to update housekeeping status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const statusClass = (status?: string) => {
    return String(status || "Cleaning")
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  return (
    <div className="front-desk-section">
      <div className="front-desk-section-head">
        <div>
          <h3>Housekeeping</h3>
          <p>
            Track room cleaning and housekeeping
            readiness.
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
          <span>
            Loading housekeeping status...
          </span>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="front-desk-empty">
          <Sparkles size={34} />
          <h4>No housekeeping rooms found</h4>
          <p>
            No rooms match the current search.
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

            const status =
              room.housekeepingStatus ||
              "Cleaning";

            return (
              <article
                className="front-desk-room-card"
                key={roomId}
              >
                <div className="front-desk-room-card-top">
                  <div className="front-desk-room-icon">
                    <Sparkles size={21} />
                  </div>

                  <span
                    className={`front-desk-status ${statusClass(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="front-desk-room-number">
                  Room {roomNumber}
                </div>

                <div className="front-desk-room-name">
                  {roomName}
                </div>

                <label className="front-desk-field-label">
                  Housekeeping status
                </label>

                <select
                  value={status}
                  disabled={
                    updatingId === roomId
                  }
                  onChange={(event) =>
                    handleStatusChange(
                      room,
                      event.target.value
                    )
                  }
                >
                  {HOUSEKEEPING_STATUS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
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