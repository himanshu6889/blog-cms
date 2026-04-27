import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import showIcon from "../../assets/show.svg";
import hideIcon from "../../assets/hide.svg";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [capsLock, setCapsLock] =
    useState(false);

  const [remember, setRemember] =
    useState(false);

  const [error, setError] = useState("");

  const [shake, setShake] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    console.log("Login clicked"); // for debugging
  try {
    const res = await fetch(
      "http://localhost:5000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username, // using username field as email
          password: password,
        }),
      }
    );

    const data = await res.json();
    console.log("Response:", data); // for debugging

    if (!res.ok) {
      setError(data.message || "Login failed");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    //  store token
    localStorage.setItem("token", data.token);

    // optional remember
    if (remember) {
      localStorage.setItem("rememberAdmin", "true");
    }

    // redirect
    setTimeout(() => {
  navigate("/admin");
}, 100);

  } catch (err) {
    console.error(err);
    setError("Server error");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">

      <div className="absolute top-6 left-6">
        <Link
        to="/"
        className="text-blue-500 hover:text-blue-400 font-medium"
        >
          ← Back to Website
          </Link>
          </div>

      <style>
        {`
          @keyframes shake {
            0% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-8px); }
            80% { transform: translateX(8px); }
            100% { transform: translateX(0); }
          }

          .shake {
            animation: shake 0.45s ease;
          }
        `}
      </style>

      <div
        className={`bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-8 transition-all duration-300 ${
          shake ? "shake" : ""
        }`}
      >
        <h1 className="text-3xl font-bold mb-2 text-center text-slate-900 dark:text-white">
          Admin Login
        </h1>

        <p className="text-gray-500 dark:text-slate-400 mb-8 text-center">
          Sign in to manage your blog
        </p>

        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none p-3 rounded-xl mb-4 transition"
        />

        {/* Password */}
        <div className="relative mb-2">
          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyUp={(e) =>
              setCapsLock(
                e.getModifierState(
                  "CapsLock"
                )
              )
            }
            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none p-3 rounded-xl pr-14 transition"
          />

          {/* Icon Button */}
          <button
            type="button"
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition duration-200 active:scale-90"
          >
            <img
              src={
                showPassword
                  ? hideIcon
                  : showIcon
              }
              alt="toggle password"
              className={`w-6 h-6 opacity-60 dark:invert brightness-10 contrast-150 hover:opacity-100 hover:scale-90 hover:rotate-0 hover:drop-shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${
                showPassword
                  ? "rotate-0 scale-80"
                  : "rotate-0 scale-80"
              }`}
            />
          </button>
        </div>

        {/* Caps Lock */}
        {capsLock && (
          <p className="text-orange-500 text-sm mb-2">
            Caps Lock is ON
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mb-3">
            {error}
          </p>
        )}

        {/* Remember + Forgot */}
        <div className="flex justify-between items-center mb-6 text-sm">

          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={() =>
                setRemember(!remember)
              }
            />
            Remember me
          </label>

          <button
            onClick={() =>
              navigate(
                "/forgot-password"
              )
            }
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Forgot Password?
          </button>

        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3 rounded-xl font-semibold transition duration-200 shadow-lg"
        >
          Login
        </button>


        <p className="mt-4 text-sm text-center">       
          Don’t have an account?{" "}
          <span
          className="text-blue-500 cursor-pointer"
          onClick={() => navigate("/signup")}>
            Signup
            </span>
            </p>
      </div>
    </div>
  );
}

