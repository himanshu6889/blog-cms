import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../api";
import { authFetch } from "../utils/csrfUtils"; // ✅ added

export default function ProfileMenu() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  const fetchUser = () => {
    fetch(`${API_BASE}/api/users/me`, {
      credentials: "include", // ✅ use cookie-based auth
    })
      .then(res => res.json())
      .then(data => setUser(data));
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Listen for profile updates
  useEffect(() => {
    window.addEventListener("profileUpdated", fetchUser);
    return () => {
      window.removeEventListener("profileUpdated", fetchUser);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const logout = async () => {
    await authFetch(`${API_BASE}/api/auth/logout`, { // ✅ was raw fetch()
      method: "POST",
    });
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
        
      {/* Avatar + Name */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 cursor-pointer"
      >
        {user.avatar ? (
          <img
          src={user.avatar}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
          {user.name?.charAt(0).toUpperCase()}
          </div>
        )}

        <span className="text-slate-900 dark:text-white font-semibold">
          {user.name}
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 text-black dark:text-white rounded shadow-lg">
          <button
          onClick={() => {
            setOpen(false);         
            navigate("/admin/profile");
        }}
            className="block w-full text-left px-4 py-2 hover:bg-slate-200 dark:hover:bg-gray-700"
          >
            Profile
          </button>

          <button
          onClick={() => {
            setOpen(false);
            logout();
        }}
            className="block w-full text-left px-4 py-2 hover:bg-slate-200 dark:hover:bg-gray-700 text-red-400"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
