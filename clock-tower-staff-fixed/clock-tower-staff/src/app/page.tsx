"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const role = String(user.role ?? "").toLowerCase();

    switch (role) {
      case "admin":
      case "manager":
        router.replace("/pos/manager");
        break;

      case "cashier":
        router.replace("/pos/cashier");
        break;

      case "waiter":
        router.replace("/pos/waiter");
        break;

      case "kitchen":
        router.replace("/kitchen");
        break;

      default:
        router.replace("/unauthorized");
        break;
    }
  }, [user, loading, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f3eb",
        color: "#2b211c",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "32px",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            margin: "0 auto 18px",
            border: "4px solid #e3d8ca",
            borderTopColor: "#6b4b3e",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />

        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          CLOCK TOWER
        </h1>

        <p
          style={{
            marginTop: 8,
            color: "#75675e",
          }}
        >
          Loading Staff POS...
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}