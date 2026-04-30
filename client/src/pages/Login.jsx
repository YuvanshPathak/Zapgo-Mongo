import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase";
import { upsertUser } from "../utils/api";
import useParticles from "../hooks/useParticles";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useParticles();

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await upsertUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      navigate("/app");
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      setError("Google Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await upsertUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      // Valid login, AuthContext will catch user change
      navigate("/app");
    } catch (err) {
      console.error("Email Login Error:", err);
      setError("Login failed. Check your email and password.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="particles" id="particles"></div>

      <header className="header">
        <div className="logo pulse">⚡ ZapGo</div>
        <button
          className="admin-btn"
          onClick={() => navigate("/admin")}
        >
          Admin Login
        </button>
      </header>

      <div className="login-container relative z-10">
        <div className="text-center mb-6 relative z-10">
          <h1 className="title">Welcome to <br></br>ZapGo</h1>
          <p className="text-gray-600 text-lg">
            Your journey to smarter EV travel starts here
          </p>
        </div>

        {error && (
          <div className="error-msg relative z-10">
            {error}
          </div>
        )}

        {/* Email/Password Login Form */}
        <form onSubmit={handleEmailLogin} className="mb-6 relative z-10">
          <div className="input-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ display: 'inline-block', borderTopColor: 'white', width: '20px', height: '20px' }}></span> : "Login"}
          </button>
        </form>

        <div className="divider relative z-10">
          <span>OR</span>
        </div>

        <div className="mb-6 relative z-10">
          <button
            className={`google-btn w-full ${loading ? "loading" : ""}`}
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <i className="bi bi-google"></i>
            <span>Continue with Google</span>
            <div className="spinner"></div>
          </button>
        </div>

        <div className="text-center mb-6 relative z-10">
          <p className="text-gray-600 mb-2">New to ZapGo?</p>
          <br></br>
          <button
            onClick={() => navigate("/register")}
            className="secondary-btn"
          >
            Register New Account
          </button>
        </div>


      </div>
    </div>
  );
}
