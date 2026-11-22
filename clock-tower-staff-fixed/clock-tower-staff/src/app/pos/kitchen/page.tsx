"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/layout/Shell";
import KitchenBoard from "@/components/kitchen/KitchenBoard";
import { useAuthContext } from "@/context/AuthContext";

export default function KitchenPOSPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  useEffect(() => {
    if (!loading && (!user || (user.role !== "Kitchen" && user.role !== "Manager" && user.role !== "Owner"))) {
      router.replace(user ? "/unauthorized" : "/login");
    }
  }, [user, loading, router]);
  if (loading || !user) return <div className="ct-loading-page">Loading kitchen...</div>;
  return <Shell active="Kitchen" role={user.role}><div className="page-head"><div><h1>Kitchen Display System</h1><p>Live orders, preparation timers and handover status.</p></div><span className="status-pill ok">● LIVE</span></div><KitchenBoard /></Shell>;
}
