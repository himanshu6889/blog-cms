import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";


export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAdminRoute = location.pathname.startsWith("/admin");
    if (isAdminRoute && !token) navigate("/login");
  }, [navigate, location.pathname]);

  const confirmLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      <Sidebar pinned={pinned} setPinned={setPinned} />

      {/* MAIN CONTENT: use individual padding sides to avoid md:p-8 overriding pl */}
      <main
        style={{ paddingLeft: pinned ? "280px" : "84px" }}
        className="min-h-screen transition-all duration-300 pt-6 pr-6 pb-6 md:pt-8 md:pr-8 md:pb-8"
      >
        <div className="flex justify-end mb-4">
          <ProfileMenu />
          </div>
        <Outlet />
      </main>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
              <FaSignOutAlt className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">Logout?</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Are you sure you want to logout?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="py-3 rounded-2xl border border-slate-300 dark:border-slate-600 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="py-3 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
