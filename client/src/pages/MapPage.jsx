// src/pages/MapPage.jsx
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useAuth } from "../context/AuthContext";
import { narrateRoute } from "../utils/geminiNarrator.js";
import { createBooking, getBookingsByUser, addLedgerBlock } from "../utils/api";
import Toast, { useToast } from "../components/Toast";

const defaultMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const useDynamicCharging = true;
const fixedChargeTime = 30; // minutes

export default function MapPage() {
  const { user } = useAuth();

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routingRef = useRef(null);
  const stopMarkersRef = useRef([]);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rangeKm, setRangeKm] = useState(300); // can be number or "" while editing
  const [initialCharge, setInitialCharge] = useState("");
  const [finalCharge, setFinalCharge] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [ampm, setAmpm] = useState("AM");

  const [loadingRoute, setLoadingRoute] = useState(false);
  const [totalDist, setTotalDist] = useState(null);
  const [totalTimeHrs, setTotalTimeHrs] = useState(null);
  const [stops, setStops] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [narration, setNarration] = useState("");
  const [narrating, setNarrating] = useState(false);
  const [narrateError, setNarrateError] = useState("");
  const [narrateSpots, setNarrateSpots] = useState([]);

  const { toast, showToast } = useToast();

  // -------- Helpers --------

  async function getCoordinates(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.length > 0 ? { lat: +data[0].lat, lng: +data[0].lon } : null;
  }

  async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      return (
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.state ||
        "Unknown Location"
      );
    } catch {
      return "Unknown Location";
    }
  }

  function formatTime(baseDate, offsetMins) {
    const d = new Date(baseDate.getTime());
    d.setMinutes(d.getMinutes() + offsetMins);
    return d.toTimeString().split(":").slice(0, 2).join(":");
  }

  // -------- Map init --------
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 200);
  }, []);

  // Load bookings from API for sidebar mini-list
  useEffect(() => {
    if (!user) return;
    getBookingsByUser(user.uid)
      .then((res) => setBookings(res.data || []))
      .catch(() => setBookings([]));
  }, [user]);

  // -------- Route planning --------

  const handlePlanRoute = async () => {
    if (loadingRoute) return;

    setLoadingRoute(true);

    const startTrim = start.trim();
    const endTrim = end.trim();

    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);

    // parse initial/final charges
    const initChargeNum = Number.parseInt(initialCharge, 10);
    const finalChargeNum = Number.parseInt(finalCharge, 10);

    // validate presence of start/end
    if (!startTrim || !endTrim) {
      setLoadingRoute(false);
      showToast("Enter both Start & Destination!", "error");
      return;
    }

    // validate time
    if (
      isNaN(hoursNum) ||
      isNaN(minutesNum) ||
      hoursNum < 1 ||
      hoursNum > 12 ||
      minutesNum < 0 ||
      minutesNum > 59
    ) {
      setLoadingRoute(false);
      showToast("Enter a valid journey start time!", "error");
      return;
    }

    // validate initial/final charges (must be integers between 1 and 100)
    if (
      Number.isNaN(initChargeNum) ||
      Number.isNaN(finalChargeNum) ||
      initChargeNum < 1 ||
      initChargeNum > 100 ||
      finalChargeNum < 1 ||
      finalChargeNum > 100
    ) {
      setLoadingRoute(false);
      showToast("Initial and Final charge must be numbers between 1 and 100.", "error");
      return;
    }

    // validate range: required and must be 1..2000
    const rangeNum = Number(rangeKm);
    if (rangeKm === "" || Number.isNaN(rangeNum) || rangeNum < 1 || rangeNum > 2000) {
      setLoadingRoute(false);
      showToast("Range must be a number between 1 and 2000 km.", "error");
      return;
    }

    // NOTE: allow finalCharge > initialCharge (user may plan to charge en route)

    let hours24 = hoursNum % 12;
    if (ampm === "PM") hours24 += 12;

    const journeyStart = new Date();
    journeyStart.setHours(hours24, minutesNum, 0, 0);

    const startC = await getCoordinates(startTrim);
    const endC = await getCoordinates(endTrim);

    if (!startC || !endC) {
      setLoadingRoute(false);
      showToast("Invalid locations!", "error");
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) {
      setLoadingRoute(false);
      showToast("Map not ready yet.", "error");
      return;
    }

    // remove old routing & markers
    if (routingRef.current) {
      map.removeControl(routingRef.current);
      routingRef.current = null;
    }
    stopMarkersRef.current.forEach((m) => map.removeLayer(m));
    stopMarkersRef.current = [];

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(startC.lat, startC.lng), L.latLng(endC.lat, endC.lng)],
      routeWhileDragging: false,
      addWaypoints: false,
      show: false,
      createMarker: () => null,
    }).addTo(map);

    routingRef.current = routingControl;
    const startMarker = L.marker([startC.lat, startC.lng], {
      icon: defaultMarkerIcon,
    }).addTo(map);

    const endMarker = L.marker([endC.lat, endC.lng], {
      icon: defaultMarkerIcon,
    }).addTo(map);

    stopMarkersRef.current.push(startMarker, endMarker);

    routingControl.on("routesfound", async (e) => {
      const route = e.routes[0];
      const summary = route.summary;

      const distKm = summary.totalDistance / 1000;
      const timeHrs = summary.totalTime / 3600;

      setTotalDist(distKm);
      setTotalTimeHrs(timeHrs);
      document.getElementById("routeDetails")?.classList.remove("hidden");

      await calculateStops(route, distKm, timeHrs, journeyStart, map);

      setLoadingRoute(false);
      showToast("Route planned successfully!", "success");
    });

    routingControl.on("routingerror", (e) => {
      console.error("Routing error:", e);
      setLoadingRoute(false);
      showToast("Failed to plan route. Please try again.", "error");
    });
  };

  async function calculateStops(route, totalDist, timeHrs, journeyStart, map) {
    const range = Number(rangeKm) || 250;
    const coords = route.coordinates;

    const stopsCount = Math.floor(totalDist / range);
    if (stopsCount <= 0) {
      setStops([]);
      return;
    }

    const segmentMinutes = (timeHrs * 60) / stopsCount;
    const newStops = [];

    for (let i = 1; i <= stopsCount; i++) {
      const idx = Math.floor((i * range / totalDist) * coords.length);
      const point = coords[idx];
      const locName = await reverseGeocode(point.lat, point.lng);

      const elapsedToStop = i * segmentMinutes;

      const arrivalTime = formatTime(journeyStart, elapsedToStop);

      const chargeDur = useDynamicCharging
        ? Math.min(60, 30 + Math.floor(totalDist / range))
        : fixedChargeTime;

      const departureTime = formatTime(journeyStart, elapsedToStop + chargeDur);

      newStops.push({
        id: i,
        name: locName,
        arrival: arrivalTime,
        departure: departureTime,
        chargeMins: chargeDur,
      });

      const marker = L.marker([point.lat, point.lng], {
        icon: defaultMarkerIcon,
      })
        .addTo(map)
        .bindPopup(
          `<b>${locName}</b><br>
           Arrival: ${arrivalTime}<br>
           Departure: ${departureTime}<br>
           Charge: ${chargeDur} mins`
        );

      stopMarkersRef.current.push(marker);
    }

    setStops(newStops);
  }

  // -------- Booking --------

  async function handleBooking() {
    if (!totalDist || !totalTimeHrs || !start || !end) {
      showToast("Plan a route before booking.", "error");
      return;
    }

    const initChargeNum = Number.parseInt(initialCharge, 10);
    const finalChargeNum = Number.parseInt(finalCharge, 10);

    if (
      Number.isNaN(initChargeNum) ||
      Number.isNaN(finalChargeNum) ||
      initChargeNum < 1 ||
      initChargeNum > 100 ||
      finalChargeNum < 1 ||
      finalChargeNum > 100
    ) {
      showToast("Initial and Final charge must be numbers between 1 and 100.", "error");
      return;
    }

    const rangeNum = Number(rangeKm);
    if (rangeKm === "" || Number.isNaN(rangeNum) || rangeNum < 1 || rangeNum > 2000) {
      showToast("Range must be a number between 1 and 2000 km.", "error");
      return;
    }

    // ---- LEDGER (MongoDB) ----
    try {
      await addLedgerBlock({
        uid:      user?.uid  || '',
        from:     start.trim(),
        to:       end.trim(),
        distance: String(totalDist.toFixed(1)),
        duration: String(Number(totalTimeHrs).toFixed(1)),
      });
    } catch (ledgerErr) {
      console.warn('Ledger write failed (non-critical):', ledgerErr.message);
    }
    // ---- END LEDGER ----

    // Save booking to MongoDB
    try {
      const res = await createBooking({
        uid: user?.uid || null,
        email: user?.email || null,
        start: start.trim(),
        destination: end.trim(),
        distance: String(totalDist.toFixed(1)),
        durationHours: String(Number(totalTimeHrs).toFixed(1)),
        initialCharge: initChargeNum,
        finalCharge: finalChargeNum,
        rangeKm: rangeNum,
        stops,
      });
      // Refresh sidebar list
      if (res.data) setBookings((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error("MongoDB booking save failed:", err);
    }

    showToast("Booking confirmed!", "success");
  }

  // -------- AI Route Narrator --------

  const handleNarrate = async () => {
    setNarrating(true);
    setNarration("");
    setNarrateError("");
    setNarrateSpots([]);
    try {
      const { narration: text, spots } = await narrateRoute({ start, end, totalDist, totalTimeHrs, stops, initialCharge, finalCharge, rangeKm });
      setNarration(text);
      setNarrateSpots(spots || []);
    } catch (err) {
      console.error("[ZapGo Narrator] Error:", err);
      setNarrateError(err?.message || "Could not generate narration. Please try again.");
    } finally {
      setNarrating(false);
    }
  };

  // -------- Render --------

  return (
    <div className="map-layout">
      {/* LEFT PANEL */}
      <div className="map-sidebar">
        {/* user profile */}
        <div className="user-card">
          <div className="avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" />
            ) : (
              <span>{user?.displayName?.[0]?.toUpperCase() || "U"}</span>
            )}
          </div>

          <div>
            <p className="user-name">{user?.displayName || "User"}</p>
            <p className="user-email">{user?.email || ""}</p>
          </div>
        </div>

        {/* inputs */}
        <label className="field-label">Starting Point</label>
        <input
          className="field-input"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          placeholder="e.g. Srinagar"
        />

        <label className="field-label">Destination</label>
        <input
          className="field-input"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          placeholder="e.g. Kanyakumari"
        />

        <label className="field-label">Initial & Final Charge (%)</label>
        <div className="field-row">
          <input
            type="number"
            className="field-input"
            placeholder="Initial %"
            min="1"
            max="100"
            value={initialCharge}
            onChange={(e) => setInitialCharge(e.target.value)}
          />
          <input
            type="number"
            className="field-input"
            placeholder="Final %"
            min="1"
            max="100"
            value={finalCharge}
            onChange={(e) => setFinalCharge(e.target.value)}
          />
        </div>

        <label className="field-label">Range (in km)</label>
        <input
          type="number"
          className="field-input"
          placeholder="between 1 and 2000"
          min="1"
          max="2000"
          value={rangeKm}
          onKeyDown={(e) => {
            // prevent e/E and +/-
            if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
          }}
          onChange={(e) => {
            const v = e.target.value;
            // allow empty input so user can clear
            if (v === "") return setRangeKm("");
            // allow only integer digits
            if (!/^\d+$/.test(v)) return;
            // clamp to bounds on entry (but we still validate on Plan/Book)
            const num = Number(v);
            if (num < 1 || num > 2000) {
              // Do not set out-of-range; show toast to guide user
              showToast("Range must be between 1 and 2000 km.", "error");
              return;
            }
            setRangeKm(num);
          }}
        />

        <label className="field-label">Journey Start Time</label>
        <div className="field-row">
          <input
            type="number"
            className="field-input"
            placeholder="HH"
            min="1"
            max="12"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <input
            type="number"
            className="field-input"
            placeholder="MM"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <select
            className="field-input"
            value={ampm}
            onChange={(e) => setAmpm(e.target.value)}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>

        <button
          className="plan-btn"
          onClick={handlePlanRoute}
          disabled={loadingRoute}
        >
          {loadingRoute ? (
            <>
              <span className="loader" /> Planning...
            </>
          ) : (
            "Plan Route"
          )}
        </button>

        {/* Trip summary & stops */}
        {totalDist != null && (
          <div id="routeDetails" className="route-details">
            <div className="trip-summary">
              <p className="trip-title">Trip Summary</p>
              <p>
                Distance:{" "}
                <span className="trip-highlight">
                  {totalDist.toFixed(1)}
                </span>{" "}
                km
              </p>
              <p>
                Est. Time:{" "}
                <span className="trip-highlight">
                  {Math.round(totalTimeHrs)}
                </span>{" "}
                hrs
              </p>
            </div>

            <h3 className="stops-title">Suggested Charging Stops:</h3>
            <div className="stops-list">
              {stops.length === 0 && (
                <div className="no-stops">No charging required!</div>
              )}
              {stops.map((s) => (
                <div key={s.id} className="stop-card">
                  <p className="stop-name">{s.name}</p>
                  <p className="stop-line">Arrival: {s.arrival}</p>
                  <p className="stop-line">Departure: {s.departure}</p>
                  <p className="stop-line">Charge: {s.chargeMins} mins</p>
                </div>
              ))}
            </div>
            <button
              className="book-btn"
              onClick={handleBooking}
              disabled={!totalDist}
            >
              Confirm Booking
            </button>

            {/* AI Route Narrator */}
            <button
              className="narrate-btn"
              onClick={handleNarrate}
              disabled={narrating || totalDist === null}
            >
              <span className="narrate-btn__inner">
                <span className="narrate-btn__label">
                  AI Route Narrator
                  <svg
                    className="narrate-btn__sparkle"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    <path d="M5 3v4" />
                    <path d="M19 17v4" />
                    <path d="M3 5h4" />
                    <path d="M17 19h4" />
                  </svg>
                </span>
                <span className="narrate-btn__sub">Powered by Llama 3.2</span>
              </span>
            </button>
            {narrating && (
              <div className="narrate-loading">Generating narration...</div>
            )}
            {narration && (
              <div className="narrate-box">
                <div className="narrate-ai-badge">🤖 AI Generated</div>
                {narration}
              </div>
            )}
            {narrateSpots.length > 0 && (
              <div className="narrate-spots">
                <p className="narrate-spots__title">📍 Top spots to visit in {end}</p>
                {narrateSpots.map((spot, i) => (
                  <div key={i} className="narrate-spot-card">
                    <span className="narrate-spot-name">{spot.name}</span>
                    {spot.desc && <span className="narrate-spot-desc">{spot.desc}</span>}
                  </div>
                ))}
              </div>
            )}
            {narrateError && (
              <div className="narrate-error">{narrateError}</div>
            )}
          </div>
        )}

        {/* Bookings */}
        <div className="bookings-card">
          <h3 className="bookings-title">My Bookings</h3>
          <div className="bookings-list">
            {bookings.length === 0 && (
              <p className="bookings-empty">No bookings yet.</p>
            )}
            {bookings.map((b, idx) => (
              <div key={b._id || idx} className="booking-item">
                <div className="booking-main">
                  {b.start || b.from} → {b.destination || b.to}
                </div>
                <div className="booking-meta">
                  Distance: {b.distance || b.dist} km • Time: {b.durationHours || b.time} hrs
                  <br />
                  Booked at: {b.createdAt ? new Date(b.createdAt).toLocaleString() : "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAP */}
      <div className="map-wrapper">
        <div ref={mapRef} id="map" />
      </div>

      <Toast toast={toast} />
    </div>
  );
}