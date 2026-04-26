import { Navigate } from "react-router-dom";

const AuthRedirect = () => {
  const token = localStorage.getItem("token");

  console.log("AuthRedirect token:", token); // debug

  if (token) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default AuthRedirect;