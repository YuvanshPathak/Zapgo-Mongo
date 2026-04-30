// src/pages/BookingsPage.jsx
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString();
  }
  // fallback: already formatted string (e.g., from localStorage)
  return String(value);
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("firestore"); // or "local"
  const [error, setError] = useState("");

  useEffect(() => {
  localStorage.removeItem("zapgoBookings"); // Clear local bookings on user change
}, [user?.uid]);


  useEffect(() => {
    async function loadBookings() {
      if (!user) {
        setLoading(false);
        setBookings([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        // 1) Try Firestore
        const q = query(
          collection(db, "bookings"),
          where("uid", "==", user.uid)
        );

        const snap = await getDocs(q);
        const fsBookings = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // sort by createdAt desc (in JS, avoid composite index)
        fsBookings.sort((a, b) => {
          const da = new Date(a.createdAt || 0).getTime();
          const dbb = new Date(b.createdAt || 0).getTime();
          return dbb - da;
        });

        if (fsBookings.length > 0) {
          setBookings(fsBookings);
          setSource("firestore");
          setLoading(false);
          return;
        }

        // 2) Fallback to localStorage if Firestore empty
        const local = JSON.parse(
          localStorage.getItem("zapgoBookings") || "[]"
        );
        setBookings(local);
        setSource("local");
        setLoading(false);
      } catch (err) {
        console.error("Failed to load bookings:", err);
        setError("Could not load bookings from server.");
        const local = JSON.parse(
          localStorage.getItem("zapgoBookings") || "[]"
        );
        setBookings(local);
        setSource("local");
        setLoading(false);
      }
    }

    loadBookings();
  }, [user]);

  // basic stats
  const totalTrips = bookings.length;
  const totalDistance = bookings.reduce(
    (sum, b) => sum + (parseFloat(b.distance || b.dist) || 0),
    0
  );
  const totalHours = bookings.reduce(
    (sum, b) => sum + (parseFloat(b.durationHours || b.time) || 0),
    0
  );

  return (
    <div className="bookings-page">
      <div className="bookings-header">
        <h1>Your Bookings</h1>
        {loading && <span className="badge badge-muted">Loading...</span>}
        {!loading && source === "firestore" && (
          <span className="badge badge-success">Synced</span>
        )}
        {!loading && source === "local" && (
          <span className="badge badge-warning">Local only</span>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats */}
      <div className="bookings-stats">
        <div className="stat-card">
          <p className="stat-label">Total Trips</p>
          <p className="stat-value">{totalTrips}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Distance</p>
          <p className="stat-value">
            {totalDistance.toFixed(1)} <span className="stat-unit">km</span>
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Time</p>
          <p className="stat-value">
            {totalHours.toFixed(1)} <span className="stat-unit">hrs</span>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bookings-table-wrap">
        {bookings.length === 0 && !loading && (
          <p className="bookings-empty-state">
            You don’t have any bookings yet. Plan a route and confirm a booking
            from the Map page.
          </p>
        )}

        {bookings.length > 0 && (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Route</th>
                <th>Distance</th>
                <th>Time</th>
                <th>Booked At</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr key={b.id || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    {b.start || b.from} → {b.destination || b.to}
                  </td>
                  <td>{(b.distance || b.dist) ?? "-"} km</td>
                  <td>{(b.durationHours || b.time) ?? "-"} hrs</td>
                  <td>{formatDate(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
