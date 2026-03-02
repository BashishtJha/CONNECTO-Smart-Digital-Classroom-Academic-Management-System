import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(
      "http://localhost:5000/api/auth/login",
      { email, password }
    );

    const role = res.data.user.role;
    console.log("ROLE FROM BACKEND:", role); // DEBUG

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", role);

    if (role === "student") {
      navigate("/student/home", { replace: true });
    } else if (role === "teacher") {
      navigate("/teacher/home", { replace: true });
    } else {
      alert("Unknown role");
    }
  } catch (err) {
    console.error(err);
    alert("Invalid credentials");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-600">
          CONNECTO
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Smart Digital Classroom
        </p>
        <p
          onClick={() => navigate("/")}
          className="text-center text-sm text-gray-500 mb-4 cursor-pointer hover:text-indigo-600"
        >
          Back to Home
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Login
          </button>
          <p
  onClick={() => navigate("/select-role")}
  className="text-center text-indigo-600 mt-4 cursor-pointer"
>
  New user? Register here
</p>

        </form>
      </div>
    </div>
  );
};

export default Login;
