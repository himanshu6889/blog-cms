import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";

export default function AdminLayout() {
  const [pinned, setPinned] = useState(false);

  // ✅ No manual auth check here — ProtectedRoute handles it via HTTP-only cookie.
  // The old localStorage/useEffect check was conflicting with cookie-based auth.

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <Sidebar pinned={pinned} setPinned={setPinned} />

      <main
        style={{ paddingLeft: pinned ? "280px" : "84px" }}
        className="min-h-screen bg-white dark:bg-slate-900 transition-all duration-300 pt-6 pr-6 pb-6 md:pt-8 md:pr-8 md:pb-8"
      >
        <div className="flex justify-end mb-4">
          <ProfileMenu />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
