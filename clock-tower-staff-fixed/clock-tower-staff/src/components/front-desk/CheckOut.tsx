"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  getCheckedInGuests,
  checkOutGuest,
} from "../../services/front-desk/checkOutService";

type Staff = {
  id?: string;
  uid?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  branchId?: string;
};

type CheckOutProps = {
  currentStaff?: Staff | null;
  branchId?: string;
};

type Guest = {
  id?: string;
  bookingId?: string;
  guestName?: string;
  customerName?: string;
  name?: string;
  phone?: string;
  roomNumber?: string;
  roomName?: string;
  roomId?: string;
  roomDocId?: string;
  roomID?: string;
  checkIn?: string;
  checkOut?: string;
  checkInDate?: string;
  checkOutDate?: string;
  status?: string;
  total?: number;
  amount?: number;
  balance?: number;
};

export default function CheckOut({
  currentStaff,
  branchId = "all",
}: CheckOutProps) {
  const [guests, setGuests] = useState<Guest[]>(
    []
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] =
    useState<string | null>(null);
  const [error, setError] = useState("");

  const loadGuests = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getCheckedInGuests(branchId);

      setGuests(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Check-out load error:",
        err
      );
      setError(
        "Unable to load checked-in guests."
      );
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
          .includes(query)
      );
    });
  }, [guests, search]);

  const handleCheckOut = async (
    guest: Guest
  ) => {
    const id =
      guest.id || guest.bookingId;

    if (!id) return;

    try {
      setCheckingOut(id);
      setError("");

      await checkOutGuest(
        guest,
        currentStaff,
        branchId
      );

      setGuests((previous) =>
        previous.filter((item) => {
          const itemId =
            item.id || item.bookingId;

          return itemId !== id;
        })
      );
    } catch (err) {
      console.error(
        "Check-out error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete check-out."
      );
    } finally {
      setCheckingOut(null);
    }
  };

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
          <h3>Check-out</h3>
          <p>
            Complete guest check-out and release the
            room for housekeeping.
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
            placeholder="Search guest or room..."
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
            Loading checked-in guests...
          </span>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="front-desk-empty">
          <LogOut size={34} />
          <h4>No checked-in guests</h4>
          <p>
            There are currently no guests waiting for
            check-out.
          </p>
        </div>
      ) : (
        <div className="front-desk-check-grid">
          {filteredGuests.map((guest) => {
            const id =
              guest.id ||
              guest.bookingId ||
              "";

            const name =
              guest.guestName ||
              guest.customerName ||
              guest.name ||
              "Guest";

            const room =
              guest.roomNumber ||
              guest.roomName ||
              guest.roomId ||
              "Room";

            return (
              <article
                className="front-desk-check-card"
                key={id}
              >
                <div className="front-desk-check-card-head">
                  <div className="front-desk-check-icon checkout">
                    <LogOut size={20} />
                  </div>

                  <span className="front-desk-status checked-in">
                    Checked-in
                  </span>
                </div>

                <h4>{name}</h4>

                <div className="fd-detail-row">
                  <span>Room</span>
                  <strong>{room}</strong>
                </div>

                <div className="fd-detail-row">
                  <span>Check-in</span>
                  <strong>
                    {formatDate(
                      guest.checkIn ||
                        guest.checkInDate
                    )}
                  </strong>
                </div>

                <div className="fd-detail-row">
                  <span>Check-out</span>
                  <strong>
                    {formatDate(
                      guest.checkOut ||
                        guest.checkOutDate
                    )}
                  </strong>
                </div>

                {guest.phone && (
                  <div className="fd-detail-row">
                    <span>Phone</span>
                    <strong>{guest.phone}</strong>
                  </div>
                )}

                <button
                  type="button"
                  className="front-desk-primary-button"
                  disabled={checkingOut === id}
                  onClick={() =>
                    handleCheckOut(guest)
                  }
                >
                  {checkingOut === id ? (
                    <>
                      <Loader2
                        size={16}
                        className="fd-spin"
                      />
                      Checking out...
                    </>
                  ) : (
                    <>
                      <LogOut size={16} />
                      Check-out Guest
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}