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

// Trust Vercel proxy
app.set('trust proxy', 1);

// Robust Persistent Session Store
const dbUrl = process.env.DATABASE_URL;
let sessionStore;

if (dbUrl) {
  try {
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000 // Timeout 5s agar tidak hang
    });

    sessionStore = new pgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: false
    });

    // Handle store errors so server doesn't crash
    sessionStore.on('error', (err) => {
      console.error('Session Store Error:', err.message);
    });
  } catch (err) {
    console.error('Failed to init persistent session store:', err.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
  store: sessionStore, // Falls back to MemoryStore if sessionStore is undefined
  secret: process.env.SESSION_SECRET || 'afif-portfolio-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  name: 'afif_portfolio_sid',
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  }
}));

// Routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/api', apiRoutes);
app.use('/admin/api', adminRoutes);

// Static files (with cache control for Vercel)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d'
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Default route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize DB safely
if (supabase) {
  initialize().catch(err => console.error('Database initialization error:', err));
}

// Start local server if not on Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Portfolio running at http://localhost:${PORT}`);
  });
}

module.exports = app;
