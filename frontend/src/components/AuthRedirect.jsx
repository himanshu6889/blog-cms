import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API_BASE from "../api";

const AuthRedirect = () => {
  const [status, setStatus] = useState("loading"); // "loading" | "auth" | "unauth"

  useEffect(() => {
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
  }, []);

  if (status === "loading") {
    return null; // you can replace with a spinner if you want
  }

  if (status === "auth") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default AuthRedirect;
