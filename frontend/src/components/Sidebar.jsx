import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaPen,
  FaFolder,
  FaGlobe,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";

export default function Sidebar({ pinned, setPinned }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  // expanded when pinned OR when hovering the nav/body area (NOT the header)
  const expanded = pinned || hovered;

  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside
      onMouseLeave={() => setHovered(false)}
      className={`
        fixed left-0 top-0 z-40 h-screen
        ${expanded ? "w-64" : "w-[68px]"}
        bg-gradient-to-b from-[#0b1120] via-[#0f172a] to-[#111827]
        border-r border-slate-800/70
        flex flex-col px-3 py-5 shadow-2xl
        transition-all duration-300 overflow-hidden
      `}
    >
      {/* HEADER — hovering here does NOT expand */}
      <div className="flex items-center gap-3 px-2 mb-8 min-h-[44px] flex-shrink-0">
        {expanded && (
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-white truncate">
              UxismClub
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
          </div>
        )}
        <button
          onClick={() => setPinned((p) => !p)}
          title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
          className={`
            ${expanded ? "ml-auto" : "mx-auto"}
            transition-colors p-1 rounded-lg
            ${pinned ? "text-blue-400 hover:text-blue-300" : "text-slate-400 hover:text-white"}
          `}
        >
          <FaBars size={16} />
        </button>
      </div>

      {/* NAVIGATION — hovering here expands the sidebar */}
      <nav
        onMouseEnter={() => setHovered(true)}
        className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden"
      >
        <SidebarItem to="/admin"             icon={<FaHome />}   label="Dashboard"   expanded={expanded} end />
        <SidebarItem to="/admin/create-post" icon={<FaPen />}    label="Create Post" expanded={expanded} />
        <SidebarItem to="/admin/posts"       icon={<FaFolder />} label="All Posts"   expanded={expanded} />

        <button
          onClick={() => navigate("/site")}
          className={`
            w-full flex items-center
            ${expanded ? "gap-3 px-4" : "justify-center px-0"}
            py-3 rounded-2xl font-medium
            text-slate-300 hover:bg-slate-800/80 hover:text-white
            transition-all duration-300
          `}
        >
          <span className="text-[15px] flex-shrink-0"><FaGlobe /></span>
          {expanded && <span className="truncate">View Website</span>}
        </button>
      </nav>

      {/* BOTTOM — hovering here also expands */}
      <div
        onMouseEnter={() => setHovered(true)}
        className="mt-auto space-y-3 pt-3"
      >
        {expanded && isLoggedIn && (
          <div className="rounded-2xl border border-slate-800 bg-white/5 backdrop-blur-sm p-4">
            <p className="text-sm font-semibold text-white">Administrator</p>
            <p className="text-xs text-slate-400 mt-1">Secure session active</p>
          </div>
        )}

        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-300 shadow-lg shadow-red-600/20"
          >
            <FaSignOutAlt className="flex-shrink-0" />
            {expanded && <span className="truncate">Logout</span>}
          </button>
        )}

        {expanded && (
          <p className="text-center text-[11px] text-slate-500 pb-1">Version 1.0</p>
        )}
      </div>
    </aside>
  );
}

function SidebarItem({ to, icon, label, expanded, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex items-center
        ${expanded ? "gap-3 px-4" : "justify-center px-0"}
        py-3 rounded-2xl font-medium transition-all duration-300
        ${isActive
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && expanded && (
            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white" />
          )}
          <span className="text-[15px] flex-shrink-0">{icon}</span>
          {expanded && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}
