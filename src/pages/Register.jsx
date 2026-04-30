import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import useParticles from "../hooks/useParticles";

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");

    useParticles();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(""); // Clear error on input change
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError("");

        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(formData.name)) {
            setError("Name can only contain letters and spaces");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password should be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const result = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = result.user;

            await updateProfile(user, {
                displayName: formData.name,
            });

            // Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                displayName: formData.name,
                photoURL: user.photoURL || "", // Default empty or placeholder if needed
                createdAt: new Date().toISOString(),
            });

            navigate("/app");
        } catch (err) {
            console.error("Registration Error:", err);
            if (err.code === "auth/email-already-in-use") {
                setError("An account with this email already exists. Please login instead.");
            } else {
                setError("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="particles" id="particles"></div>

            <header className="header">
                <span className="logo pulse text-white">
                    ⚡ ZapGo
                </span>
            </header>

            <div className="login-container relative z-10">
                <div className="text-center mb-6 relative z-10">
                    <h1 className="title">Create Account</h1>
                    <p className="text-gray-600">Join ZapGo for smarter EV travel</p>
                </div>

                {error && (
                    <div className="error-msg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="mb-6 relative z-10">
                    <div className="input-group">
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>

                    <button
                        type="submit"
                        className="primary-btn"
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" style={{ display: 'inline-block', borderTopColor: 'white', width: '20px', height: '20px' }}></span> : "Register"}
                    </button>
                </form>

                <div className="text-center relative z-10">
                    <p className="text-gray-600">
                        Already have an account?{" "}
                        <Link to="/login" className="link-text">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
