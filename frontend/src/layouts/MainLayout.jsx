import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  const [pinned, setPinned] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

      {/* SIDEBAR — fixed, so we use a spacer to push content */}
      <Sidebar pinned={pinned} setPinned={setPinned} isLoggedIn={false} />

      {/* Spacer that mirrors the sidebar width so content doesn't go under it */}
      <div
        style={{ width: pinned ? "256px" : "68px" }}
        className="flex-shrink-0 transition-all duration-300"
      />

      {/* MAIN CONTENT — fills remaining width naturally */}
      <main className="flex-1 min-w-0 transition-all duration-300 text-slate-800 dark:text-slate-100">
        <Outlet />
      </main>

    </div>
  );
}
