// src/pages/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../admin-login.css";
import AdminParticles from "../components/AdminParticles";

const ADMIN_CREDENTIALS = [
  { username: "admin", password: "password123" },
  { username: "YuvanshPathak", password: "12345678" },
];

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const match = ADMIN_CREDENTIALS.find(
      (c) => c.username === username && c.password === password
    );

    if (match) {
      sessionStorage.setItem("isAdminLoggedIn", "true");
      alert("Login successful!");
      navigate("/admin/dashboard", { replace: true });
    } else {
      setError("Invalid username or password!");
    }
  };

  return (
    <div className="admin-login-root">
      {/* particles background — placed before the card so it sits behind */}
      <AdminParticles />

      <div className="login-container">
        <div className="login-card" role="dialog" aria-label="Admin login">
          <h2>Admin Login</h2>

          <form id="adminLoginForm" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" id="loginButton">
              Login
            </button>

            <button
              type="button"
              className="user-login-btn"
              onClick={() => navigate("/login")}
              style={{ marginTop: "0.6rem" }}
            >
              User Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
