import { useState } from "react";
import { useNavigate } from "react-router-dom";

import showIcon from "../../assets/show.svg";
import hideIcon from "../../assets/hide.svg";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const getStrength = () => {
    if (newPassword.length === 0)
      return "Empty";

    if (newPassword.length < 4)
      return "Weak";

    if (newPassword.length < 8)
      return "Medium";

    return "Strong";
  };

  const handleReset = () => {
    if (answer.toLowerCase() !== "india") {
      alert("Wrong Answer");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    localStorage.setItem(
      "adminPassword",
      newPassword
    );

    alert("Password Reset Successful");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">

        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Reset Password
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Recover admin access
        </p>

        {/* Security Answer */}
        <div className="relative mb-6">
          <input
            type="text"
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            placeholder=" "
            className="peer w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-4 pt-6 pb-2 outline-none focus:border-blue-500 transition"
          />

          <label className="absolute left-4 top-2 text-xs text-slate-500 dark:text-slate-400 peer-focus:text-blue-600">
            Which country do you live in?
          </label>
        </div>

        {/* New Password */}
        <div className="relative mb-4">
          <input
            type={show1 ? "text" : "password"}
            value={newPassword}
            onChange={(e) =>
              setNewPassword(
                e.target.value
              )
            }
            placeholder=" "
            className="peer w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-4 pt-6 pb-2 pr-14 outline-none focus:border-blue-500 transition"
          />

          <label className="absolute left-4 top-2 text-xs text-slate-500 dark:text-slate-400 peer-focus:text-blue-600">
            New Password
          </label>

          <button
            type="button"
            onClick={() =>
              setShow1(!show1)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <img
              src={
                show1
                  ? hideIcon
                  : showIcon
              }
              alt="toggle"
              className="w-6 h-6 opacity-60 dark:invert brightness-10 contrast-150 hover:opacity-100 hover:scale-90 transition-all duration-300 cursor-pointer"
            />
          </button>
        </div>

        {/* Premium Strength Bar */}
        {newPassword.length > 0 && (
          <div className="mb-6">

            <div className="flex justify-between mb-2">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Password Strength
              </p>

              <p
                className={`text-xs font-semibold ${
                  getStrength() === "Weak"
                    ? "text-red-500"
                    : getStrength() === "Medium"
                    ? "text-yellow-500"
                    : "text-green-600"
                }`}
              >
                {getStrength()}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1">
              <div
                className={`h-2 rounded-full ${
                  getStrength() === "Weak" ||
                  getStrength() === "Medium" ||
                  getStrength() === "Strong"
                    ? "bg-red-500"
                    : "bg-slate-200 dark:bg-slate-600"
                }`}
              />

              <div
                className={`h-2 rounded-full ${
                  getStrength() === "Medium" ||
                  getStrength() === "Strong"
                    ? "bg-yellow-500"
                    : "bg-slate-200 dark:bg-slate-600"
                }`}
              />

              <div
                className={`h-2 rounded-full ${
                  getStrength() === "Strong"
                    ? "bg-green-500"
                    : "bg-slate-200 dark:bg-slate-600"
                }`}
              />

              <div
                className={`h-2 rounded-full ${
                  getStrength() === "Strong"
                    ? "bg-green-500"
                    : "bg-slate-200 dark:bg-slate-600"
                }`}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Use 8+ characters for stronger security
            </p>

          </div>
        )}

        {/* Confirm Password */}
        <div className="relative mb-3">
          <input
            type={show2 ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            placeholder=" "
            className="peer w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-4 pt-6 pb-2 pr-14 outline-none focus:border-blue-500 transition"
          />

          <label className="absolute left-4 top-2 text-xs text-slate-500 dark:text-slate-400 peer-focus:text-blue-600">
            Confirm Password
          </label>

          <button
            type="button"
            onClick={() =>
              setShow2(!show2)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <img
              src={
                show2
                  ? hideIcon
                  : showIcon
              }
              alt="toggle"
              className="w-6 h-6 opacity-60 dark:invert brightness-10 contrast-150 hover:opacity-100 hover:scale-90 transition-all duration-300 cursor-pointer"
            />
          </button>
        </div>

        {confirmPassword &&
          newPassword !==
            confirmPassword && (
            <p className="text-red-500 text-sm mb-4">
              Passwords do not match
            </p>
          )}

        {confirmPassword &&
          newPassword ===
            confirmPassword && (
            <p className="text-green-600 text-sm mb-4">
              Passwords match
            </p>
          )}

        {/* Buttons */}
        <button
          onClick={handleReset}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition"
        >
          Reset Password
        </button>

        <button
          onClick={() =>
            navigate("/login")
          }
          className="w-full mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-700"
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}