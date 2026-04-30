// src/pages/UserLayout.jsx
import { Routes, Route } from "react-router-dom";
import Topbar from "../components/Topbar";
import MapPage from "./MapPage";
import BookingsPage from "./BookingsPage";

export default function UserLayout() {
  return (
    <div className="user-shell">
      <Topbar />
      <div className="user-main">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
        </Routes>
      </div>
    </div>
  );
}
