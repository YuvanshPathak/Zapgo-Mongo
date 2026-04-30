// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import UserLayout from "./pages/UserLayout.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

function AdminRoute({ children }) {
  const isAdmin = sessionStorage.getItem("isAdminLoggedIn") === "true";
  return isAdmin ? children : <Navigate to="/admin" replace />;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* user auth flow */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/app/*"
        element={
          <PrivateRoute>
            <UserLayout />
          </PrivateRoute>
        }
      />

      {/* admin flow */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
    </Routes>
  );
}
