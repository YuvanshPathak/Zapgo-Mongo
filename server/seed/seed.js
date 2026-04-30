require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Booking = require('../models/Booking');
const Station = require('../models/Station');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zapgo';

const users = [
  {
    uid: 'seed_uid_001',
    email: 'arjun.mehta@example.com',
    displayName: 'Arjun Mehta',
    photoURL: 'https://i.pravatar.cc/150?u=arjun',
    role: 'admin'
  },
  {
    uid: 'seed_uid_002',
    email: 'priya.sharma@example.com',
    displayName: 'Priya Sharma',
    photoURL: 'https://i.pravatar.cc/150?u=priya',
    role: 'user'
  },
  {
    uid: 'seed_uid_003',
    email: 'rohan.verma@example.com',
    displayName: 'Rohan Verma',
    photoURL: 'https://i.pravatar.cc/150?u=rohan',
    role: 'user'
  }
];

const bookings = [
  {
    uid: 'seed_uid_002',
    email: 'priya.sharma@example.com',
    start: 'Mumbai, Maharashtra',
    destination: 'Pune, Maharashtra',
    distance: '148',
    durationHours: '2.5',
    initialCharge: 85,
    finalCharge: 42,
    rangeKm: 380,
    stops: [
      { id: 1, name: 'Khopoli EV Hub', arrival: '10:45', departure: '11:05', chargeMins: 20 },
      { id: 2, name: 'Lonavala Fast Charge', arrival: '11:30', departure: '11:45', chargeMins: 15 }
    ]
  },
  {
    uid: 'seed_uid_002',
    email: 'priya.sharma@example.com',
    start: 'Pune, Maharashtra',
    destination: 'Nashik, Maharashtra',
    distance: '211',
    durationHours: '3.8',
    initialCharge: 90,
    finalCharge: 28,
    rangeKm: 380,
    stops: [
      { id: 1, name: 'Sinnar EV Station', arrival: '14:10', departure: '14:35', chargeMins: 25 },
      { id: 2, name: 'Ozar Charging Point', arrival: '15:05', departure: '15:23', chargeMins: 18 },
      { id: 3, name: 'Nashik City Hub', arrival: '16:00', departure: '16:10', chargeMins: 10 }
    ]
  },
  {
    uid: 'seed_uid_003',
    email: 'rohan.verma@example.com',
    start: 'Delhi, NCR',
    destination: 'Agra, Uttar Pradesh',
    distance: '233',
    durationHours: '3.2',
    initialCharge: 78,
    finalCharge: 35,
    rangeKm: 420,
    stops: [
      { id: 1, name: 'Faridabad EV Stop', arrival: '09:15', departure: '09:35', chargeMins: 20 },
      { id: 2, name: 'Mathura Supercharger', arrival: '10:45', departure: '11:15', chargeMins: 30 }
    ]
  },
  {
    uid: 'seed_uid_003',
    email: 'rohan.verma@example.com',
    start: 'Jaipur, Rajasthan',
    destination: 'Udaipur, Rajasthan',
    distance: '393',
    durationHours: '5.5',
    initialCharge: 95,
    finalCharge: 20,
    rangeKm: 400,
    stops: [
      { id: 1, name: 'Ajmer EV Point', arrival: '11:00', departure: '11:35', chargeMins: 35 },
      { id: 2, name: 'Bhilwara Fast Charge', arrival: '13:30', departure: '13:55', chargeMins: 25 },
      { id: 3, name: 'Chittorgarh Hub', arrival: '15:15', departure: '15:35', chargeMins: 20 }
    ]
  },
  {
    uid: 'seed_uid_001',
    email: 'arjun.mehta@example.com',
    start: 'Bengaluru, Karnataka',
    destination: 'Mysuru, Karnataka',
    distance: '145',
    durationHours: '2.3',
    initialCharge: 88,
    finalCharge: 55,
    rangeKm: 450,
    stops: [
      { id: 1, name: 'Bidadi EV Station', arrival: '08:30', departure: '08:45', chargeMins: 15 },
      { id: 2, name: 'Maddur Charger', arrival: '09:10', departure: '09:20', chargeMins: 10 }
    ]
  }
];

const stations = [
  {
    name: 'Mumbai Central EV Hub',
    location: 'Mumbai, Maharashtra'
  },
  {
    name: 'Delhi Saket Supercharger',
    location: 'Saket, New Delhi'
  },
  {
    name: 'Bengaluru Koramangala Station',
    location: 'Koramangala, Bengaluru'
  },
  {
    name: 'Pune Hinjewadi EV Point',
    location: 'Hinjewadi, Pune'
  }
];

const seed = async () => {
  try {
    console.log('🔌  Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅  Connected to MongoDB');

    console.log('🗑️   Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Booking.deleteMany({}),
      Station.deleteMany({})
    ]);
    console.log('✅  Existing data cleared');

    console.log('🌱  Inserting seed data...');
    const insertedUsers = await User.insertMany(users);
    console.log(`✅  Inserted ${insertedUsers.length} users`);

    const insertedBookings = await Booking.insertMany(bookings);
    console.log(`✅  Inserted ${insertedBookings.length} bookings`);

    const insertedStations = await Station.insertMany(stations);
    console.log(`✅  Inserted ${insertedStations.length} stations`);

    console.log('\n🎉  Database seeded successfully!');
  } catch (err) {
    console.error('❌  Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌  MongoDB disconnected');
  }
};

seed();