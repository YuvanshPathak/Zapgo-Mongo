⚡ ZapGo — EV Charging & Route Planner

[Link](https://zapgo-yuvansh.vercel.app/)


A full-stack web application that helps EV users plan long-distance trips with smart routing, automatic charging stop detection, and real-time booking insights — all in a clean, responsive UI.

🚀 Features

🔐 Authentication

Google OAuth for users

Custom admin login

Protected routes using React Router

🗺️ Smart EV Route Planning

Distance, duration & energy consumption estimation

Automatic charging stop recommendations

Interactive map interface

🔋 Charging Station Management (Admin)

Add / edit / delete stations

Simulated notifications to stations

📊 Booking Insights

Live bookings dashboard

Total distance & travel time calculations

Daily analytics powered by Chart.js

☁️ Cloud Integration

Firebase Firestore (real-time)

Firebase Authentication

Automated sync for user bookings & admin stats

🛠️ Tech Stack
Frontend

React + Vite

React Router

Chart.js

Custom CSS

Backend / Cloud

Firebase Firestore

Firebase Authentication

Deployment

Vercel (CI/CD enabled)

📁 Project Structure
```text
src/
├── assets/ → icons, logos
├── components/ → shared UI (sidebar, topbar, etc.)
├── context/ → global AuthContext
├── firebase/ → firebase.js config
├── hooks/ → custom hooks
├── pages/ → user + admin pages
├── styles.css → global styles
├── user.css → user dashboard styles
├── admin.css → admin dashboard styles
└── main.jsx
```