import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";

export default function Shell({ children, active, role }: { children: ReactNode; active?: string; role?: string }) {
  return <div className="app-shell"><Sidebar active={active} /><div className="main-area"><Topbar role={role} /><main className="content">{children}</main></div><MobileNav /></div>;
}
