const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { queryAll, queryGet, queryRun } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// ============ AUTH ============
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  try {
    const user = queryGet('SELECT * FROM admin_users WHERE username = ?', [username]);
    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.isAdmin = true;
      req.session.adminId = user.id;
      req.session.adminUsername = user.username;
      return res.json({ success: true, message: 'Login successful' });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/check-auth', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ authenticated: true, username: req.session.adminUsername });
  }
  res.json({ authenticated: false });
});

router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = queryGet('SELECT * FROM admin_users WHERE id = ?', [req.session.adminId]);
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hashed = bcrypt.hashSync(newPassword, 10);
    queryRun('UPDATE admin_users SET password = ? WHERE id = ?', [hashed, req.session.adminId]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ UPLOAD ============
router.post('/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ success: true, filename: req.file.filename, path: '/uploads/' + req.file.filename });
});

// ============ SETTINGS ============
router.get('/settings/:key', requireAuth, (req, res) => {
  try {
    const row = queryGet('SELECT value FROM settings WHERE key = ?', [req.params.key]);
    if (row) return res.json(JSON.parse(row.value));
    res.status(404).json({ error: 'Setting not found' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/settings/:key', requireAuth, (req, res) => {
  try {
    const value = JSON.stringify(req.body);
    const existing = queryGet('SELECT key FROM settings WHERE key = ?', [req.params.key]);
    if (existing) {
      queryRun('UPDATE settings SET value = ?, updated_at = datetime("now") WHERE key = ?', [value, req.params.key]);
    } else {
      queryRun('INSERT INTO settings (key, value) VALUES (?, ?)', [req.params.key, value]);
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// ============ SERVICES CRUD ============
router.get('/services', requireAuth, (req, res) => {
  res.json(queryAll('SELECT * FROM services ORDER BY sort_order ASC'));
});

router.post('/services', requireAuth, (req, res) => {
  const { title, description, icon } = req.body;
  const maxRow = queryGet('SELECT MAX(sort_order) as max_val FROM services');
  const maxOrder = (maxRow && maxRow.max_val) || 0;
  const result = queryRun('INSERT INTO services (title, description, icon, sort_order) VALUES (?, ?, ?, ?)', [title, description, icon || 'star', maxOrder + 1]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/services/:id', requireAuth, (req, res) => {
  const { title, description, icon, sort_order } = req.body;
  queryRun('UPDATE services SET title = ?, description = ?, icon = ?, sort_order = ? WHERE id = ?', [title, description, icon, sort_order || 0, req.params.id]);
  res.json({ success: true });
});

router.delete('/services/:id', requireAuth, (req, res) => {
  queryRun('DELETE FROM services WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ============ PROJECTS CRUD ============
router.get('/projects', requireAuth, (req, res) => {
  res.json(queryAll('SELECT * FROM projects ORDER BY sort_order ASC'));
});

router.post('/projects', requireAuth, (req, res) => {
  const { title, description, category, image, link } = req.body;
  const maxRow = queryGet('SELECT MAX(sort_order) as max_val FROM projects');
  const maxOrder = (maxRow && maxRow.max_val) || 0;
  const result = queryRun('INSERT INTO projects (title, description, category, image, link, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [title, description, category || 'all', image || '', link || '#', maxOrder + 1]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/projects/:id', requireAuth, (req, res) => {
  const { title, description, category, image, link, sort_order } = req.body;
  queryRun('UPDATE projects SET title = ?, description = ?, category = ?, image = ?, link = ?, sort_order = ? WHERE id = ?', [title, description, category, image, link, sort_order || 0, req.params.id]);
  res.json({ success: true });
});

router.delete('/projects/:id', requireAuth, (req, res) => {
  queryRun('DELETE FROM projects WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ============ TESTIMONIALS CRUD ============
router.get('/testimonials', requireAuth, (req, res) => {
  res.json(queryAll('SELECT * FROM testimonials ORDER BY sort_order ASC'));
});

router.post('/testimonials', requireAuth, (req, res) => {
  const { name, role, content, avatar, rating } = req.body;
  const maxRow = queryGet('SELECT MAX(sort_order) as max_val FROM testimonials');
  const maxOrder = (maxRow && maxRow.max_val) || 0;
  const result = queryRun('INSERT INTO testimonials (name, role, content, avatar, rating, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [name, role, content, avatar || '', rating || 5, maxOrder + 1]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/testimonials/:id', requireAuth, (req, res) => {
  const { name, role, content, avatar, rating, sort_order } = req.body;
  queryRun('UPDATE testimonials SET name = ?, role = ?, content = ?, avatar = ?, rating = ?, sort_order = ? WHERE id = ?', [name, role, content, avatar, rating, sort_order || 0, req.params.id]);
  res.json({ success: true });
});

router.delete('/testimonials/:id', requireAuth, (req, res) => {
  queryRun('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ============ SKILLS CRUD ============
router.get('/skills', requireAuth, (req, res) => {
  res.json(queryAll('SELECT * FROM skills ORDER BY sort_order ASC'));
});

router.post('/skills', requireAuth, (req, res) => {
  const { name } = req.body;
  const maxRow = queryGet('SELECT MAX(sort_order) as max_val FROM skills');
  const maxOrder = (maxRow && maxRow.max_val) || 0;
  const result = queryRun('INSERT INTO skills (name, sort_order) VALUES (?, ?)', [name, maxOrder + 1]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/skills/:id', requireAuth, (req, res) => {
  const { name, sort_order } = req.body;
  queryRun('UPDATE skills SET name = ?, sort_order = ? WHERE id = ?', [name, sort_order || 0, req.params.id]);
  res.json({ success: true });
});

router.delete('/skills/:id', requireAuth, (req, res) => {
  queryRun('DELETE FROM skills WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
