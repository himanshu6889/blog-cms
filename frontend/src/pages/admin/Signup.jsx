import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Signup successful!");
      navigate("/login");

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="p-6 shadow-lg rounded w-96">
        <h2 className="text-xl mb-4">Signup</h2>

        <input
          type="text"
          name="name"
          placeholder="Name"
          className="w-full mb-3 p-2 border"
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border"
          onChange={handleChange}
          required
        />

        <button className="w-full bg-blue-500 text-white p-2">
          Signup
        </button>
      </form>
    </div>
  );
};

export default Signup;