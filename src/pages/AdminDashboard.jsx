// src/pages/AdminDashboard.jsx
// near other imports
// in src/pages/AdminDashboard.jsx
import {
  computeHashForBlock,
  createBlock,
  verifyChain,
  getLastBlock,        // <-- if you need the whole block
  getLastBlockHash,    // <-- if you only need the last hash
} from "../utils/ledger.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import "../admin.css";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ---------- small helpers ----------

function formatCreatedAt(val) {
  if (!val) return "-";
  const d = new Date(val);
  if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  return String(val);
}

// stats chart options (outside component so they aren't recreated every render)
const statsChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
  },
};

// ---------- custom hooks to keep component smaller ----------

function useUsers() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const snap = await getDocs(collection(db, "users"));
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(arr);
      } catch (err) {
        console.error("Error loading users:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  return { users, loadingUsers, setUsers };
}

function useStations() {
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);

  useEffect(() => {
    async function loadStations() {
      setLoadingStations(true);
      try {
        const snap = await getDocs(collection(db, "stations"));
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStations(arr);
      } catch (err) {
        console.error("Error loading stations:", err);
      } finally {
        setLoadingStations(false);
      }
    }
    loadStations();
  }, []);

  return { stations, loadingStations, setStations };
}

function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    const bookingsRef = collection(db, "bookings");

    const unsub = onSnapshot(
      bookingsRef,
      (snapshot) => {
        const arr = [];
        snapshot.forEach((docSnap) => {
          arr.push({ id: docSnap.id, ...docSnap.data() });
        });

        // sort by createdAt desc
        arr.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dbb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dbb - da;
        });

        setBookings(arr);
        setLoadingBookings(false);
      },
      (err) => {
        console.error("Error loading bookings:", err);
        setLoadingBookings(false);
      }
    );

    return () => unsub();
  }, []);

  return { bookings, loadingBookings };
}

// ---------- main component ----------

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("users"); // "users" | "stations" | "stats" | "bookings"

  const { users, loadingUsers, setUsers } = useUsers();
  const { stations, loadingStations, setStations } = useStations();
  const { bookings, loadingBookings } = useBookings();

  const [stationName, setStationName] = useState("");
  const [stationLocation, setStationLocation] = useState("");
  const [notificationStationId, setNotificationStationId] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  const [editingStationId, setEditingStationId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");

  // --- Guard: kick out if not admin ---
  useEffect(() => {
    if (sessionStorage.getItem("isAdminLoggedIn") !== "true") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  // --- Handlers ---

  // basic verification handler — put below other handlers
const handleVerifyBooking = async (booking) => {
  try {
    // 1) load ledger
    const snap = await getDocs(collection(db, "ledger"));
    const chain = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (chain.length === 0) {
      alert("No ledger blocks found.");
      return;
    }

    // 2) sort by index asc (safety in case server ordering differs)
    chain.sort((a,b) => (Number(a.index)||0) - (Number(b.index)||0));

    // 3) verify entire chain
    if (!verifyChain(chain)) {
      alert("Chain ❌: invalid block found (ledger integrity failed).");
      return;
    }

    // 4) find matching block for this booking (tweak predicate if your field names differ)
    const match = chain.find(b => {
      const sameUid = String(b.uid || "") === String(booking.uid || booking.userUid || "");
      const sameFrom = String((b.from || b.start || "")).trim() === String((booking.from || booking.start || "")).trim();
      const sameTo = String((b.to || b.destination || "")).trim() === String((booking.to || booking.destination || "")).trim();
      const sameDist = (b.distance || b.dist || "") == (booking.distance || booking.dist || booking.dist || "");
      const sameTime = (b.duration || b.durationHours || b.time || "") == (booking.durationHours || booking.time || "");
      const sameCreated = String(b.createdAt || "") === String(booking.createdAt || "");
      return sameUid && sameFrom && sameTo && (sameDist || sameTime || sameCreated);
    });

    if (!match) {
      alert("No matching block found for this booking in ledger.");
      return;
    }

    // 5) recompute hash and compare
    const computed = computeHashForBlock(match);
    if (computed === (match.hash || match._hash || "")) {
      alert("Booking verified: hash matches and chain valid.");
    } else {
      alert("Booking verification failed: hash mismatch for matched block.");
      console.error("Stored block:", match);
      console.error("Computed hash:", computed);
    }
  } catch (err) {
    console.error("Verify failed:", err);
    alert("Verification failed — check console.");
  }
};



  const handleLogout = () => {
    sessionStorage.removeItem("isAdminLoggedIn");
    navigate("/admin", { replace: true });
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user: " + err.message);
    }
  };

  const handleAddStation = async (e) => {
    e.preventDefault();
    if (!stationName.trim() || !stationLocation.trim()) {
      alert("Please enter station name and location.");
      return;
    }
    try {
      const ref = await addDoc(collection(db, "stations"), {
        name: stationName.trim(),
        location: stationLocation.trim(),
      });
      setStations((prev) => [
        ...prev,
        { id: ref.id, name: stationName.trim(), location: stationLocation.trim() },
      ]);
      setStationName("");
      setStationLocation("");
      alert("Station added successfully!");
    } catch (err) {
      console.error("Error adding station:", err);
      alert("Failed to add station: " + err.message);
    }
  };

  const handleDeleteStation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this station?")) return;
    try {
      await deleteDoc(doc(db, "stations", id));
      setStations((prev) => prev.filter((s) => s.id !== id));
      alert("Station deleted successfully!");
    } catch (err) {
      console.error("Error deleting station:", err);
      alert("Failed to delete station: " + err.message);
    }
  };

  const handleStartEditStation = (station) => {
    setEditingStationId(station.id);
    setEditName(station.name || "");
    setEditLocation(station.location || "");
  };

  const handleCancelEditStation = () => {
    setEditingStationId(null);
    setEditName("");
    setEditLocation("");
  };

  const handleSaveEditStation = async (stationId) => {
    const newName = editName.trim();
    const newLocation = editLocation.trim();

    if (!newName || !newLocation) {
      alert("Station name and location cannot be empty.");
      return;
    }

    try {
      await updateDoc(doc(db, "stations", stationId), {
        name: newName,
        location: newLocation,
      });

      setStations((prev) =>
        prev.map((s) =>
          s.id === stationId ? { ...s, name: newName, location: newLocation } : s
        )
      );

      setEditingStationId(null);
      setEditName("");
      setEditLocation("");
      alert("Station updated successfully!");
    } catch (err) {
      console.error("Error updating station:", err);
      alert("Failed to update station: " + err.message);
    }
  };

  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!notificationStationId) {
      alert("Please select a charging station first.");
      return;
    }
    if (!notificationMessage.trim()) {
      alert("Enter a notification message.");
      return;
    }
    alert(
      `Notification sent to station ${notificationStationId} (simulated).\nMessage: ${notificationMessage}`
    );
    setNotificationStationId("");
    setNotificationMessage("");
  };

  // --- stats from bookings ---

  const totalBookings = bookings.length;
  const totalDistance = bookings.reduce((sum, b) => {
    const d = parseFloat(b.distance || b.dist);
    return sum + (isNaN(d) ? 0 : d);
  }, 0);
  const totalHours = bookings.reduce((sum, b) => {
    const h = parseFloat(b.durationHours || b.time);
    return sum + (isNaN(h) ? 0 : h);
  }, 0);

  // chart data: bookings per day
  const dailyCounts = {};
  bookings.forEach((b) => {
    if (!b.createdAt) return;
    const d = new Date(b.createdAt);
    if (Number.isNaN(d.getTime())) return;

    const key =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");

    dailyCounts[key] = (dailyCounts[key] || 0) + 1;
  });

  const statsLabels = Object.keys(dailyCounts).sort();
  const statsValues = statsLabels.map((k) => dailyCounts[k]);

  const statsChartData = {
    labels: statsLabels,
    datasets: [
      {
        label: "Bookings per day",
        data: statsValues,
        backgroundColor: "rgba(0, 255, 136, 0.8)", // green
      },
    ],
  };

  // ---------- JSX ----------

  return (
    <div className="admin-dashboard-root">
      {/* NAVBAR */}
      <nav className="navbar">
        <h1 className="admin-title">Admin Portal</h1>
        <button id="logoutBtn" className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      {/* LAYOUT */}
      <div className="container">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <ul>
            <li
              className={activeTab === "users" ? "active" : ""}
              onClick={() => setActiveTab("users")}
            >
              View Users
            </li>
            <li
              className={activeTab === "stations" ? "active" : ""}
              onClick={() => setActiveTab("stations")}
            >
              Manage Charging Stations
            </li>
            <li
              className={activeTab === "stats" ? "active" : ""}
              onClick={() => setActiveTab("stats")}
            >
              View Statistics
            </li>
            <li
              className={activeTab === "bookings" ? "active" : ""}
              onClick={() => setActiveTab("bookings")}
            >
              View Bookings
            </li>
          </ul>
        </aside>

        {/* MAIN CONTENT */}
        <main className="content">
          {/* USERS TAB */}
          {activeTab === "users" && (
            <div id="viewUsers" className="tab-content active">
              <h2>Registered Users</h2>
              {loadingUsers ? (
                <p>Loading users...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4}>No users found.</td>
                      </tr>
                    )}
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.displayName || u.name || "N/A"}</td>
                        <td>{u.email || "N/A"}</td>
                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* STATIONS TAB */}
          {activeTab === "stations" && (
            <div id="manageStations" className="tab-content active">
              <h2>Manage Charging Stations</h2>

              <form id="addStationForm" onSubmit={handleAddStation}>
                <input
                  type="text"
                  id="stationName"
                  placeholder="Station Name"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  id="stationLocation"
                  placeholder="Location"
                  value={stationLocation}
                  onChange={(e) => setStationLocation(e.target.value)}
                  required
                />
                <button type="submit">Add Station</button>
              </form>

              <h3>Send Notification</h3>
              <form id="notificationForm" onSubmit={handleSendNotification}>
                <select
                  id="stationSelect"
                  value={notificationStationId}
                  onChange={(e) => setNotificationStationId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a Charging Station
                  </option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || "Station"}
                    </option>
                  ))}
                </select>

                <textarea
                  id="notificationMessage"
                  rows={4}
                  placeholder="Enter your message here..."
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  required
                />

                <button type="submit">Send Notification</button>
              </form>

              <ul id="stationsList">
                {loadingStations && <li>Loading stations...</li>}
                {!loadingStations && stations.length === 0 && (
                  <li>No stations found.</li>
                )}
                {stations.map((s) => {
                  const isEditing = editingStationId === s.id;
                  return (
                    <li key={s.id} className="station-row">
                      {isEditing ? (
                        <>
                          <div className="station-info">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Station name"
                              style={{ marginBottom: "0.4rem" }}
                            />
                            <input
                              type="text"
                              value={editLocation}
                              onChange={(e) => setEditLocation(e.target.value)}
                              placeholder="Location"
                            />
                          </div>
                          <div className="station-actions">
                            <button
                              className="edit-station-btn"
                              onClick={() => handleSaveEditStation(s.id)}
                            >
                              Save
                            </button>
                            <button
                              className="delete-station-btn"
                              onClick={handleCancelEditStation}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="station-info">
                            <span className="station-name">
                              {s.name || "Unnamed"}
                            </span>
                            <span className="station-location">
                              {" "}
                              - {s.location || "-"}
                            </span>
                          </div>
                          <div className="station-actions">
                            <button
                              className="edit-station-btn"
                              onClick={() => handleStartEditStation(s)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-station-btn"
                              onClick={() => handleDeleteStation(s.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === "stats" && (
            <div id="viewStats" className="tab-content active">
              <h2>Booking Statistics</h2>

              {loadingBookings ? (
                <p>Loading bookings...</p>
              ) : (
                <>
                  <div className="stats-overview" style={{ marginBottom: "1rem" }}>
                    <p>
                      Total bookings: <strong>{totalBookings}</strong>
                    </p>
                    <p>
                      Total distance:{" "}
                      <strong>{totalDistance.toFixed(1)} km</strong>
                    </p>
                    <p>
                      Total time:{" "}
                      <strong>{totalHours.toFixed(1)} hrs</strong>
                    </p>
                  </div>

                  <div
                    className="stats-chart-wrapper"
                    style={{ height: "260px", marginTop: "0.5rem" }}
                  >
                    {statsLabels.length === 0 ? (
                      <p>No booking data available yet for chart.</p>
                    ) : (
                      <Bar data={statsChartData} options={statsChartOptions} />
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === "bookings" && (
            <div id="viewBookings" className="tab-content active">
              <h2>All Bookings</h2>
              {loadingBookings ? (
                <p>Loading bookings...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>User Email</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Distance (km)</th>
                      <th>Duration (hrs)</th>
                      <th>Created At</th>
                      <th>Verify</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center" }}>
                          No bookings found.
                        </td>
                      </tr>
                    )}
                    {bookings.map((b) => {
                      let distance = b.distance || b.dist || "-";
                      if (distance !== "-" && !isNaN(distance)) {
                        distance = Number(distance).toFixed(1);
                      }

                      let durationDisplay = "-";
                      if (typeof b.durationHours !== "undefined") {
                        const dh = Number(b.durationHours);
                        durationDisplay = isNaN(dh)
                          ? b.durationHours
                          : dh.toFixed(1);
                      } else if (typeof b.durationMinutes !== "undefined") {
                        durationDisplay = b.durationMinutes;
                      } else if (typeof b.time !== "undefined") {
                        durationDisplay = b.time;
                      }

                      return (
                        <tr key={b.id}>
                          <td>{b.email || "N/A"}</td>
                          <td>{b.start || b.source || "-"}</td>
                          <td>{b.destination || b.dest || "-"}</td>
                          <td>{distance}</td>
                          <td>{durationDisplay}</td>
                          <td>{formatCreatedAt(b.createdAt)}</td>
                          <td>
                          <button className="verify-btn" onClick={() => handleVerifyBooking(b)}>Verify</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}