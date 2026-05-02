# ⚡ ZapGo — EV Charging & Route Planner

[Live Demo](https://zapgo-yuvansh.vercel.app/)

A modern, full-stack EV travel assistant that helps users plan long-distance trips with smart routing, automatic charging stop detection, and secure booking management. 

Now migrated from a pure Firebase architecture to a robust **Node.js + Express + MongoDB** backend.

---

## 🚀 Key Features

- **🗺️ Smart EV Route Planning**: Interactive map interface with real-time distance, duration, and energy consumption estimation.
- **🔋 Auto-Stop Detection**: Automatically recommends charging stations based on vehicle range and battery levels.
- **🔐 Multi-Role Auth**: 
  - **Users**: Secure Google OAuth and Email login via Firebase.
  - **Admins**: Dedicated administrative portal with shared-secret verification.
- **🛠️ Station Management**: Full CRUD operations for EV charging stations.
- **📊 Real-time Analytics**: Admin dashboard with booking trends and usage statistics powered by MongoDB aggregation pipelines and Chart.js.
- **⛓️ Immutable Ledger**: Critical booking data is mirrored to a blockchain-inspired, tamper-evident ledger on MongoDB for verification.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **React + Vite**: High-performance frontend framework.
- **Leaflet**: Interactive mapping and routing.
- **Chart.js**: Dynamic data visualization.
- **Firebase Auth**: Client-side authentication.
- **Custom CSS**: Premium, responsive UI with glassmorphism and animations.

### Backend (`/server`)
- **Node.js + Express**: Scalable API architecture.
- **MongoDB + Mongoose**: Document database for users, bookings, and stations.
- **Firebase Admin SDK**: Server-side token verification.
- **CORS / Dotenv**: Secure configuration management.

---

## 📁 Project Structure

```text
/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # Shared UI (Sidebar, Topbar)
│   │   ├── pages/       # User & Admin views
│   │   ├── utils/       # API client, ledger logic
│   │   └── firebase/    # Config for Auth
│   └── package.json
│
├── server/           # Node.js backend
│   ├── models/       # Mongoose Schemas
│   ├── routes/       # Express Route definitions
│   ├── controllers/  # API Logic
│   ├── middleware/   # Auth & Token verification
│   └── server.js     # Entry point
│
└── PROJECT_DOCUMENTATION.md  # Detailed technical overview
```

---

## 🚦 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ 
- **MongoDB**: Local Community Server or MongoDB Atlas
- **Firebase Project**: Service Account JSON and Web Config

### 2. Backend Setup (`/server`)
1. Create a `.env` file:
   ```env
   MONGO_URI=mongodb://localhost:27017/zapgo
   PORT=5000
   ADMIN_SECRET=your_admin_secret
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY="... (with \n)"
   ```
2. Install dependencies & start:
   ```bash
   npm install
   npm run dev
   ```

### 3. Frontend Setup (`/client`)
1. Create a `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_API_URL=http://localhost:5000/api
   # ... other Firebase web vars
   ```
2. Install dependencies & start:
   ```bash
   npm install
   npm run dev
   ```

---

## 🛠️ Scripts

- **`npm run dev`**: Starts the development server with Hot Module Replacement (HMR).
- **`npm run build`**: Optimizes the application for production.
- **`node seed/seed.js`**: (In `/server`) Populates the database with initial Indian EV station data.

---

## 🛡️ Security
- **JWT Verification**: Protected user routes verify Firebase ID tokens on every request.
- **Admin Secret**: Admin-only operations use a dedicated shared-secret middleware for cross-origin security.
- **CORS Enforcement**: Backend strictly restricts origins to the known frontend URL.