"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import POSPage from "@/app/pos/page";

export default function WaiterPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  if (loading || !user) return <div className="ct-loading-page">Loading waiter POS...</div>;
  return <POSPage />;
}
