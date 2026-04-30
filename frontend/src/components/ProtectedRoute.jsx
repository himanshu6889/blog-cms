import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API_BASE from "../../api";

const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState("loading"); // "loading" | "auth" | "unauth"

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include", // ✅ sends the HTTP-only cookie
    })
      .then((res) => {
        if (res.ok) {
          setStatus("auth");
        } else {
          setStatus("unauth");
        }
      })
      .catch(() => setStatus("unauth"));
  }, []);

  if (status === "loading") {
    return null; // or replace with a spinner/skeleton
  }

  if (status === "unauth") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
