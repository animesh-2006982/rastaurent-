"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAuthContext } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();

  const {
    user,
    loading,
    login,
  } = useAuthContext();

  const [employeeId, setEmployeeId] =
    useState("CT-102");

  const [pin, setPin] =
    useState("1234");

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/pos");
    }
  }, [loading, user, router]);

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    const success = await login(
      employeeId,
      pin,
    );

    if (!success) {
      setError(
        "Invalid Employee ID or PIN.",
      );

      setSubmitting(false);
      return;
    }

    router.replace("/pos");
  }

  return (
    <main className="ct-login-page">
      <div className="ct-login-left">
        <div className="ct-login-brand">
          <div className="ct-login-logo">
            CT
          </div>

          <div>
            <strong>
              CLOCK TOWER
            </strong>

            <span>
              RESTAURANT & CAFE
            </span>
          </div>
        </div>

        <div className="ct-login-copy">
          <span className="ct-eyebrow">
            STAFF POS SYSTEM
          </span>

          <h1>
            Fast service.
            <br />
            <em>Better experience.</em>
          </h1>

          <p>
            Manage orders, tables,
            payments and kitchen
            operations from one
            powerful workspace.
          </p>

          <div className="ct-login-features">
            <span>✓ Smart POS</span>
            <span>✓ Kitchen KDS</span>
            <span>✓ Live Orders</span>
          </div>
        </div>
      </div>

      <div className="ct-login-right">
        <form
          className="ct-login-card"
          onSubmit={handleSubmit}
        >
          <div className="ct-login-heading">
            <span>Welcome back</span>

            <h2>
              Staff Login
            </h2>

            <p>
              Enter your staff credentials
              to continue.
            </p>
          </div>

          <label>
            Employee ID

            <input
              value={employeeId}
              onChange={(event) =>
                setEmployeeId(
                  event.target.value,
                )
              }
              placeholder="CT-102"
              autoComplete="username"
            />
          </label>

          <label>
            PIN

            <input
              type="password"
              value={pin}
              onChange={(event) =>
                setPin(
                  event.target.value,
                )
              }
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="ct-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="ct-login-button"
            disabled={submitting}
          >
            {submitting
              ? "Signing in..."
              : "Sign In →"}
          </button>

          <div className="ct-demo-logins">
            <strong>
              Demo Staff Accounts
            </strong>

            <button
              type="button"
              onClick={() => {
                setEmployeeId(
                  "CT-102",
                );
                setPin("1234");
              }}
            >
              Cashier — CT-102
            </button>

            <button
              type="button"
              onClick={() => {
                setEmployeeId(
                  "CT-103",
                );
                setPin("1234");
              }}
            >
              Waiter — CT-103
            </button>

            <button
              type="button"
              onClick={() => {
                setEmployeeId(
                  "CT-104",
                );
                setPin("1234");
              }}
            >
              Kitchen — CT-104
            </button>

            <button
              type="button"
              onClick={() => {
                setEmployeeId(
                  "CT-105",
                );
                setPin("1234");
              }}
            >
              Manager — CT-105
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}