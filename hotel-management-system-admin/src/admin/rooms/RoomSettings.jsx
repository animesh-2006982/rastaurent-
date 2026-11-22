import React, {
  useEffect,
  useState,
} from "react";

import {
  getRoomSettings,
  saveRoomSettings,
} from "../../services/roomBookingService";

import "./room.css";

const defaults = {
  currency: "INR",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  allowFlexibleDates: true,
  allowOnlineBooking: true,
  defaultGuests: 2,
};

export default function RoomSettings() {
  const [form, setForm] =
    useState(defaults);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    getRoomSettings()
      .then((data) => {
        if (data) {
          setForm({
            ...defaults,
            ...data,
          });
        }
      })
      .catch(console.error);
  }, []);

  const save = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      await saveRoomSettings(form);

      alert("Room settings saved.");
    } catch (error) {
      console.error(error);
      alert("Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="room-page">
      <div className="room-page-head">
        <div>
          <span className="room-eyebrow">
            ROOMS & STAY
          </span>

          <h1>Room Settings</h1>

          <p>
            Configure the default booking behaviour
            for Clock Tower rooms.
          </p>
        </div>
      </div>

      <div className="room-panel settings-panel">
        <form
          className="room-form"
          onSubmit={save}
        >
          <div className="form-two">
            <label>
              Currency

              <input
                value={form.currency}
                onChange={(event) =>
                  setForm({
                    ...form,
                    currency:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Default Guests

              <input
                type="number"
                min="1"
                value={form.defaultGuests}
                onChange={(event) =>
                  setForm({
                    ...form,
                    defaultGuests:
                      event.target.value,
                  })
                }
              />
            </label>
          </div>

          <div className="form-two">
            <label>
              Check-in Time

              <input
                type="time"
                value={form.checkInTime}
                onChange={(event) =>
                  setForm({
                    ...form,
                    checkInTime:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Check-out Time

              <input
                type="time"
                value={form.checkOutTime}
                onChange={(event) =>
                  setForm({
                    ...form,
                    checkOutTime:
                      event.target.value,
                  })
                }
              />
            </label>
          </div>

          <label className="check-label">
            <input
              type="checkbox"
              checked={
                !!form.allowFlexibleDates
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  allowFlexibleDates:
                    event.target.checked,
                })
              }
            />

            Allow flexible date searches
          </label>

          <label className="check-label">
            <input
              type="checkbox"
              checked={
                !!form.allowOnlineBooking
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  allowOnlineBooking:
                    event.target.checked,
                })
              }
            />

            Allow online room bookings
          </label>

          <div className="modal-actions">
            <button
              disabled={saving}
              className="room-btn room-btn-primary"
            >
              {saving
                ? "Saving..."
                : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}