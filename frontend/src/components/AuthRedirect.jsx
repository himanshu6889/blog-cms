import { Navigate } from "react-router-dom";

export default function AuthRedirect() {
  const isLoggedIn =
    localStorage.getItem("isAdminLoggedIn") === "true";

  return isLoggedIn
    ? <Navigate to="/admin" replace />
    : <Navigate to="/login" replace />;
}