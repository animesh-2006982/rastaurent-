"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarCheck,
  Search,
  RefreshCw,
  Check,
  X,
} from "lucide-react";

import {
  getReservations,
  updateReservationStatus,
} from "../../services/front-desk/reservationService";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Checked-in",
  "Checked-out",
  "Cancelled",
];

export default function Reservations({
  currentStaff,
  branchId = "all",
}) {
  const [reservations, setReservations] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [savingId, setSavingId] =
    useState("");

  const loadReservations = async () => {
    setLoading(true);

    try {
      const data =
        await getReservations(branchId);

      setReservations(data);
    } catch (error) {
      console.error(error);

      setMessage(
        error?.message ||
          "Unable to load reservations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [branchId]);

  const updateStatus = async (
    reservation,
    status
  ) => {
    setSavingId(reservation.id);
    setMessage("");

    try {
      await updateReservationStatus(
        reservation.id,
        status,
        currentStaff,
        branchId
      );

      setReservations((previous) =>
        previous.map((item) =>
          item.id === reservation.id
            ? {
                ...item,
                status,
              }
            : item
        )
      );

      setMessage(
        `Reservation updated to ${status}.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error?.message ||
          "Unable to update reservation."
      );
    } finally {
      setSavingId("");
    }
  };

  const filtered =
    reservations.filter((reservation) => {
      const text = [
        reservation.guestName,
        reservation.customerName,
        reservation.phone,
        reservation.roomNumber,
        reservation.id,
        reservation.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });

  return (
    <div className="fd-page">
      <div className="fd-toolbar">
        <div>
          <h3>
            <CalendarCheck size={20} />
            Reservations
          </h3>

          <p>
            Confirm, cancel and manage room
            reservations.
          </p>
        </div>

        <div className="fd-toolbar-actions">
          <div className="fd-search">
            <Search size={16} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search reservation..."
            />
          </div>

          <button
            type="button"
            className="fd-refresh"
            onClick={loadReservations}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div className="fd-message">
          {message}
        </div>
      )}

      <div className="fd-table-card">
        {loading ? (
          <div className="fd-empty">
            Loading reservations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="fd-empty">
            No reservations found.
          </div>
        ) : (
          <div className="fd-table-wrap">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        <strong>
                          {reservation.guestName ||
                            reservation.customerName ||
                            "Guest"}
                        </strong>
                      </td>

                      <td>
                        {reservation.roomNumber ||
                          reservation.room ||
                          "—"}
                      </td>

                      <td>
                        {reservation.checkIn ||
                          reservation.checkInDate ||
                          "—"}
                      </td>

                      <td>
                        {reservation.checkOut ||
                          reservation.checkOutDate ||
                          "—"}
                      </td>

                      <td>
                        {reservation.phone ||
                          reservation.guestPhone ||
                          "—"}
                      </td>

                      <td>
                        <span className="fd-status">
                          {reservation.status ||
                            "Pending"}
                        </span>
                      </td>

                      <td>
                        <div className="fd-action-row">
                          <select
                            value={
                              reservation.status ||
                              "Pending"
                            }
                            disabled={
                              savingId ===
                              reservation.id
                            }
                            onChange={(e) =>
                              updateStatus(
                                reservation,
                                e.target.value
                              )
                            }
                          >
                            {STATUS_OPTIONS.map(
                              (status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status}
                                </option>
                              )
                            )}
                          </select>

                          {reservation.status ===
                            "Pending" && (
                            <>
                              <button
                                type="button"
                                title="Confirm"
                                className="fd-icon-success"
                                onClick={() =>
                                  updateStatus(
                                    reservation,
                                    "Confirmed"
                                  )
                                }
                              >
                                <Check size={15} />
                              </button>

                              <button
                                type="button"
                                title="Cancel"
                                className="fd-icon-danger"
                                onClick={() =>
                                  updateStatus(
                                    reservation,
                                    "Cancelled"
                                  )
                                }
                              >
                                <X size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}