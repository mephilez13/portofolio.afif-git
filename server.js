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

// Trust Vercel's proxy for secure cookies
app.set('trust proxy', 1);

// Persistent Session Store in Supabase Postgres
const dbUrl = process.env.DATABASE_URL;
let sessionStore;

if (dbUrl) {
  sessionStore = new pgSession({
    pool: new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    }),
    tableName: 'session',
    createTableIfMissing: false
  });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
  store: sessionStore, // Using database store if URL exists
  secret: process.env.SESSION_SECRET || 'afif-portfolio-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  name: 'afif_portfolio_sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/api', apiRoutes);
app.use('/admin/api', adminRoutes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For Vercel: Initialize connection as soon as possible
if (supabase) {
  initialize().catch(err => console.error('Database initialization error:', err));
}

// Only listen on local environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Portfolio server running at http://localhost:${PORT}`);
    console.log(`📋 Admin panel: http://localhost:${PORT}/admin`);
  });
}

module.exports = app;
