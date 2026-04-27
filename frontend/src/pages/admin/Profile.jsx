import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
    bio: "",
  });

  const token = localStorage.getItem("token");

  // FETCH PROFILE
  useEffect(() => {
    fetch("http://localhost:5000/api/users/me", {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error(err));
  }, []);

  // UPDATE PROFILE
  const handleUpdate = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(user),
      });

      const data = await res.json();
      setUser(data);
      alert("Profile updated!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="bg-gray-800 p-8 rounded-2xl max-w-xl shadow-lg">

        {/* Avatar */}
        <div className="mb-6 flex items-center gap-4">
          {/* Avatar Preview */}
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-white">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Input */}
          <div className="flex-1">
            <label className="block mb-1">Avatar URL</label>
            <input
              type="text"
              value={user.avatar || ""}
              onChange={(e) => setUser({ ...user, avatar: e.target.value })}
              className="w-full p-2 bg-gray-700 rounded"
            />
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label>Name</label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="w-full p-2 mt-1 bg-gray-700 rounded"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label>Email</label>
          <input
            type="text"
            value={user.email}
            disabled
            className="w-full p-2 mt-1 bg-gray-600 rounded"
          />
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label>Bio</label>
          <textarea
            value={user.bio || ""}
            onChange={(e) => setUser({ ...user, bio: e.target.value })}
            className="w-full p-2 mt-1 bg-gray-700 rounded"
          />
        </div>

        <button
          onClick={handleUpdate}
          className="bg-blue-600 hover:bg-blue-700 transition px-6 py-2 rounded-lg font-semibold"
        >
          Update Profile
        </button>
      </div>
    </div>
  );
}
