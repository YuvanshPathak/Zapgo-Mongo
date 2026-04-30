// src/utils/api.js
// Central API client for ZapGo backend.
// Automatically attaches the Firebase Auth token to every protected request.

import { auth } from "../firebase/firebase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function getToken() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Not authenticated");
  return currentUser.getIdToken();
}

async function authFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Admin fetch — uses shared admin secret from sessionStorage (no Firebase needed)
async function adminFetch(path, options = {}) {
  const secret = sessionStorage.getItem("adminSecret");
  if (!secret) throw new Error("Not authenticated");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ── Users ──────────────────────────────────────────────────────────────────

/** Called on every login to upsert the user in MongoDB */
export async function upsertUser(payload) {
  return authFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Admin: get all users */
export async function getAllUsers() {
  return adminFetch("/users");
}

/** Admin: delete a user by uid */
export async function deleteUser(uid) {
  return adminFetch(`/users/${uid}`, { method: "DELETE" });
}

// ── Bookings ────────────────────────────────────────────────────────────────

/** Create a new booking */
export async function createBooking(payload) {
  return authFetch("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Get all bookings for the logged-in user */
export async function getBookingsByUser(uid) {
  return authFetch(`/bookings/user/${uid}`);
}

/** Admin: get all bookings */
export async function getAllBookings() {
  return adminFetch("/bookings");
}

/** Admin: get aggregated stats */
export async function getBookingStats() {
  return adminFetch("/bookings/stats");
}

// ── Stations ────────────────────────────────────────────────────────────────

/** Public: get all stations — no token needed */
export async function getAllStations() {
  const res = await fetch(`${BASE_URL}/stations`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load stations");
  return data;
}

/** Admin: add a station */
export async function createStation(payload) {
  return adminFetch("/stations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Admin: update a station by MongoDB _id */
export async function updateStation(id, payload) {
  return adminFetch(`/stations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Admin: delete a station by MongoDB _id */
export async function deleteStation(id) {
  return adminFetch(`/stations/${id}`, { method: "DELETE" });
}
