import { useEffect, useState } from "react";
import API_BASE from "../../api"; 
import { authFetch } from "../../utils/csrfUtils"; // ✅ added

export default function Profile() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
    bio: "",
  });

  const saveProfile = async (nextUser) => {
    const res = await authFetch(`${API_BASE}/api/users/me`, { // ✅ was raw fetch()
      method: "PUT",
      body: JSON.stringify(nextUser),
      // authFetch sets Content-Type: application/json and X-CSRF-Token automatically
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Failed to update profile");
    }

    setUser(data);
    window.dispatchEvent(new Event("profileUpdated"));
    return data;
  };

  // FETCH PROFILE — GET is safe, plain fetch is fine
  useEffect(() => {
    fetch(`${API_BASE}/api/users/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error(err));
  }, []);

  // UPDATE PROFILE
  const handleUpdate = async () => {
    try {
      await saveProfile(user);
      alert("Profile updated!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Profile update failed");
    }
  };

  return (
    <div className="p-6 text-slate-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl max-w-xl shadow-lg">

        {/* Avatar */}
        <div className="mb-6 flex items-center gap-4">
          {/* Avatar Preview */}
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-gray-700 text-black dark:text-white flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-black dark:text-white">
                {user.name ? user.name.charAt(0).toUpperCase() : "?"}
              </span>
            )}
          </div>

          {/* Input */}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  alert("Image must be smaller than 2 MB.");
                  return;
                }
                try {
                  const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });
                  const nextUser = { ...user, avatar: dataUrl };
                  setUser(nextUser);
                  await saveProfile(nextUser);
                } catch (err) {
                  console.error("Avatar error:", err);
                  alert("Failed to process image.");
                }
              }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />

            {user.avatar && (
              <button
                type="button"
                onClick={() =>
                  setUser((prev) => ({
                    ...prev,
                    avatar: "",
                  }))
                }
                className="mt-2 text-sm text-red-500 hover:underline"
              >
                Remove Avatar
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label>Name</label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="w-full p-2 mt-1 bg-slate-200 dark:bg-gray-700 text-black dark:text-white rounded"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label>Email</label>
          <input
            type="text"
            value={user.email}
            disabled
            className="w-full p-2 mt-1 bg-slate-200 dark:bg-gray-700 text-black dark:text-white rounded"
          />
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label>Bio</label>
          <textarea
            value={user.bio || ""}
            onChange={(e) => setUser({ ...user, bio: e.target.value })}
            className="w-full p-2 mt-1 bg-slate-200 dark:bg-gray-700 text-black dark:text-white rounded"
          />
        </div>

        <button
          onClick={handleUpdate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          Update Profile
        </button>
      </div>
    </div>
  );
}
