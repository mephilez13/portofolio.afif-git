require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
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

// PostgreSQL pool for session store (Supabase)
let sessionStore;
if (process.env.DATABASE_URL) {
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  sessionStore = new pgSession({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true
  });
  console.log('✅ Using PostgreSQL for sessions');
} else {
  console.warn('⚠️ DATABASE_URL missing, falling back to MemoryStore for sessions');
}

// Session menggunakan PostgreSQL (Supabase) agar tidak hilang saat reload/cold start
app.use(session({
  store: sessionStore, // Akan undefined jika fallback ke MemoryStore (default)
  secret: process.env.SESSION_SECRET || 'afif-portfolio-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 hari
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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
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
