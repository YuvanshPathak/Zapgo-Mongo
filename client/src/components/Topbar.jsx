import { useAuth } from "../context/AuthContext";
import { NavLink, useNavigate } from "react-router-dom";

export default function Topbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="app-topbar">
      <div className="app-topbar-left" onClick={() => navigate("/app")}>
        <i className="bi bi-lightning-charge-fill app-logo-icon" />
        <span className="app-logo-text">ZapGo</span>
      </div>

      <div className="app-topbar-right">
        <NavLink
          to="/app"
          end
          className={({ isActive }) =>
            "top-link" + (isActive ? " top-link-active" : "")
          }
        >
          Map
        </NavLink>

        <NavLink
          to="/app/bookings"
          className={({ isActive }) =>
            "top-link" + (isActive ? " top-link-active" : "")
          }
        >
          Bookings
        </NavLink>

        <button className="topbar-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
