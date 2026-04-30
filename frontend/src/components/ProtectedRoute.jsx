import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API_BASE from "../api";

const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState("loading"); // "loading" | "auth" | "unauth"

  useEffect(() => {
    // Re-runs every time this component mounts (i.e. every navigation to an /admin route)
    setStatus("loading");
    fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include", // sends the HTTP-only cookie
    })
      .then((res) => {
        if (res.ok) {
          setStatus("auth");
        } else {
          setStatus("unauth");
        }
      })
      .catch(() => setStatus("unauth"));
  }, []); // [] is correct — this mounts fresh on every /admin entry because the component unmounts on logout

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauth") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
