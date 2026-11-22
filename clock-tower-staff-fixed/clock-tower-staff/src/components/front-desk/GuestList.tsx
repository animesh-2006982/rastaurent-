"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";

import {
  getGuests,
} from "../../services/front-desk/guestService";

type Staff = {
  id?: string;
  uid?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  branchId?: string;
};

type GuestListProps = {
  currentStaff?: Staff | null;
  branchId?: string;
};

type Guest = {
  id?: string;
  guestId?: string;
  guestName?: string;
  customerName?: string;
  name?: string;
  phone?: string;
  email?: string;
  roomNumber?: string;
  roomName?: string;
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  checkInDate?: string;
  checkOutDate?: string;
  status?: string;
};

export default function GuestList({
  currentStaff,
  branchId = "all",
}: GuestListProps) {
  const [guests, setGuests] = useState<Guest[]>(
    []
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGuests = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getGuests(branchId);

      setGuests(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Guest list load error:",
        err
      );
      setError("Unable to load guest list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuests();
  }, [branchId]);

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return guests;

    return guests.filter((guest) => {
      const name =
        guest.guestName ||
        guest.customerName ||
        guest.name ||
        "";

      const room =
        guest.roomNumber ||
        guest.roomName ||
        guest.roomId ||
        "";

      return (
        String(name)
          .toLowerCase()
          .includes(query) ||
        String(room)
          .toLowerCase()
          .includes(query) ||
        String(guest.phone || "")
          .toLowerCase()
          .includes(query) ||
        String(guest.email || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [guests, search]);

  const formatDate = (value?: string) => {
    if (!value) return "—";

    try {
      return new Date(value).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return value;
    }
  };

  return (
    <div className="front-desk-section">
      <div className="front-desk-section-head">
        <div>
          <h3>Guest List</h3>
          <p>
            View guests currently registered through the
            hotel front desk.
          </p>
        </div>

        <button
          type="button"
          className="front-desk-refresh"
          onClick={loadGuests}
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
            placeholder="Search guest, phone, email or room..."
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
          <span>Loading guests...</span>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="front-desk-empty">
          <Users size={34} />
          <h4>No guests found</h4>
          <p>
            No guest records match the current search.
          </p>
        </div>
      ) : (
        <div className="front-desk-table-wrap">
          <table className="front-desk-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredGuests.map((guest) => {
                const id =
                  guest.id ||
                  guest.guestId ||
                  guest.phone ||
                  Math.random().toString();

                const name =
                  guest.guestName ||
                  guest.customerName ||
                  guest.name ||
                  "Guest";

                const room =
                  guest.roomNumber ||
                  guest.roomName ||
                  guest.roomId ||
                  "—";

                return (
                  <tr key={id}>
                    <td>
                      <div className="fd-primary-text">
                        {name}
                      </div>

                      {guest.email && (
                        <div className="fd-secondary-text">
                          {guest.email}
                        </div>
                      )}
                    </td>

                    <td>{room}</td>

                    <td>
                      {formatDate(
                        guest.checkIn ||
                          guest.checkInDate
                      )}
                    </td>

                    <td>
                      {formatDate(
                        guest.checkOut ||
                          guest.checkOutDate
                      )}
                    </td>

                    <td>
                      {guest.phone || "—"}
                    </td>

                    <td>
                      <span
                        className={`front-desk-status ${String(
                          guest.status ||
                            "Checked-in"
                        )
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          )}`}
                      >
                        {guest.status ||
                          "Checked-in"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}