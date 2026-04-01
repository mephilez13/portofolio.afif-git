require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { initialize, supabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Vercel's proxy
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// BACK TO BASICS: Menggunakan MemoryStore (Sesi Sementara) demi menstabilkan Vercel
app.use(session({
  secret: process.env.SESSION_SECRET || 'afif-portfolio-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/api', apiRoutes);
app.use('/admin/api', adminRoutes);

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize Supabase only if it doesn't crash on start
if (supabase) {
  initialize().catch(err => console.error('Supabase Init Error:', err));
}

// Start server (Local only)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server ready on port ${PORT}`);
  });
}

module.exports = app;
