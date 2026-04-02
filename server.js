require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { initialize, supabase } = require('./database/db');
const { Store } = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Vercel's proxy
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Session Store using Supabase JS client to avoid direct pg connection timeouts
class SupabaseStore extends Store {
  async get(sid, callback) {
    if (!supabase) return callback(null, null);
    try {
      const { data, error } = await supabase.from('session').select('sess').eq('sid', sid).single();
      if (error || !data) return callback(null, null);
      callback(null, data.sess);
    } catch (err) { callback(err); }
  }

  async set(sid, sess, callback) {
    if (!supabase) return callback(null);
    try {
      const expire = new Date(sess.cookie.expires || Date.now() + 86400000).toISOString();
      await supabase.from('session').upsert([{ sid, sess, expire }], { onConflict: 'sid' });
      callback(null);
    } catch (err) { callback(err); }
  }

  async destroy(sid, callback) {
    if (!supabase) return callback(null);
    try {
      await supabase.from('session').delete().eq('sid', sid);
      callback(null);
    } catch (err) { callback(err); }
  }
}

// Session menggunakan Supabase REST API
app.use(session({
  store: supabase ? new SupabaseStore() : undefined,
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
