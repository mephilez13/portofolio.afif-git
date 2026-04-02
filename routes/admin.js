const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { supabase } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// Multer config
const storage = multer.memoryStorage();

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
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    if (!error && user && bcrypt.compareSync(password, user.password)) {
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

router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', req.session.adminId)
      .single();

    if (error || !user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hashed = bcrypt.hashSync(newPassword, 10);
    await supabase
      .from('admin_users')
      .update({ password: hashed })
      .eq('id', req.session.adminId);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ UPLOAD ============
router.post('/upload', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
      .from('portofolio-uploads')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('portofolio-uploads')
      .getPublicUrl(filePath);

    res.json({ success: true, filename: fileName, path: publicUrlData.publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload to Supabase' });
  }
});

// ============ SETTINGS ============
router.get('/settings/:key', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', req.params.key)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Setting not found' });
    res.json(typeof data.value === 'string' ? JSON.parse(data.value) : data.value);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/settings/:key', requireAuth, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('settings')
      .select('key')
      .eq('key', req.params.key)
      .single();

    const value = req.body; // Use as object for Supabase/Postgres JSONB

    if (existing) {
      await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', req.params.key);
    } else {
      await supabase
        .from('settings')
        .insert({ key: req.params.key, value });
    }
    res.json({ success: true });
  } catch (error) { 
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

// ============ SERVICES CRUD ============
router.get('/services', requireAuth, async (req, res) => {
  const { data } = await supabase.from('services').select('*').order('sort_order', { ascending: true });
  res.json(data || []);
});

router.post('/services', requireAuth, async (req, res) => {
  const { title, description, icon } = req.body;
  const { data: maxRow } = await supabase.from('services').select('sort_order').order('sort_order', { ascending: false }).limit(1).single();
  const maxOrder = (maxRow && maxRow.sort_order) || 0;
  
  const { data, error } = await supabase
    .from('services')
    .insert({ title, description, icon: icon || 'star', sort_order: maxOrder + 1 })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, id: data.id });
});

router.put('/services/:id', requireAuth, async (req, res) => {
  const { title, description, icon, sort_order } = req.body;
  await supabase
    .from('services')
    .update({ title, description, icon, sort_order: sort_order || 0 })
    .eq('id', req.params.id);
  res.json({ success: true });
});

router.delete('/services/:id', requireAuth, async (req, res) => {
  await supabase.from('services').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// ============ PROJECTS CRUD ============
router.get('/projects', requireAuth, async (req, res) => {
  const { data } = await supabase.from('projects').select('*').order('sort_order', { ascending: true });
  res.json(data || []);
});

router.post('/projects', requireAuth, async (req, res) => {
  const { title, description, category, image, link, content, client, project_date, tech_stack, extra_images } = req.body;
  const { data: maxRow } = await supabase.from('projects').select('sort_order').order('sort_order', { ascending: false }).limit(1).single();
  const maxOrder = (maxRow && maxRow.sort_order) || 0;
  
  const { data, error } = await supabase
    .from('projects')
    .insert({ 
      title, 
      description, 
      category: category || 'all', 
      image: image || '', 
      link: link || '#', 
      sort_order: maxOrder + 1,
      content: content || '',
      client: client || '',
      project_date: project_date || '',
      tech_stack: tech_stack || '',
      extra_images: extra_images || []
    })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, id: data.id });
});

router.put('/projects/:id', requireAuth, async (req, res) => {
  const { title, description, category, image, link, sort_order, content, client, project_date, tech_stack, extra_images } = req.body;
  const { error } = await supabase
    .from('projects')
    .update({ 
      title, 
      description, 
      category, 
      image, 
      link, 
      sort_order: sort_order || 0,
      content,
      client,
      project_date,
      tech_stack,
      extra_images: extra_images || []
    })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.delete('/projects/:id', requireAuth, async (req, res) => {
  await supabase.from('projects').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// ============ TESTIMONIALS CRUD ============
router.get('/testimonials', requireAuth, async (req, res) => {
  const { data } = await supabase.from('testimonials').select('*').order('sort_order', { ascending: true });
  res.json(data || []);
});

router.post('/testimonials', requireAuth, async (req, res) => {
  const { name, role, content, avatar, rating } = req.body;
  const { data: maxRow } = await supabase.from('testimonials').select('sort_order').order('sort_order', { ascending: false }).limit(1).single();
  const maxOrder = (maxRow && maxRow.sort_order) || 0;
  
  const { data, error } = await supabase
    .from('testimonials')
    .insert({ name, role, content, avatar: avatar || '', rating: rating || 5, sort_order: maxOrder + 1 })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, id: data.id });
});

router.put('/testimonials/:id', requireAuth, async (req, res) => {
  const { name, role, content, avatar, rating, sort_order } = req.body;
  await supabase
    .from('testimonials')
    .update({ name, role, content, avatar, rating, sort_order: sort_order || 0 })
    .eq('id', req.params.id);
  res.json({ success: true });
});

router.delete('/testimonials/:id', requireAuth, async (req, res) => {
  await supabase.from('testimonials').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// ============ SKILLS CRUD ============
router.get('/skills', requireAuth, async (req, res) => {
  const { data } = await supabase.from('skills').select('*').order('sort_order', { ascending: true });
  res.json(data || []);
});

router.post('/skills', requireAuth, async (req, res) => {
  const { name } = req.body;
  const { data: maxRow } = await supabase.from('skills').select('sort_order').order('sort_order', { ascending: false }).limit(1).single();
  const maxOrder = (maxRow && maxRow.sort_order) || 0;
  
  const { data, error } = await supabase
    .from('skills')
    .insert({ name, sort_order: maxOrder + 1 })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, id: data.id });
});

router.put('/skills/:id', requireAuth, async (req, res) => {
  const { name, sort_order } = req.body;
  await supabase
    .from('skills')
    .update({ name, sort_order: sort_order || 0 })
    .eq('id', req.params.id);
  res.json({ success: true });
});

router.delete('/skills/:id', requireAuth, async (req, res) => {
  await supabase.from('skills').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// ============ EXPERIENCES CRUD ============
router.get('/experiences', requireAuth, async (req, res) => {
  const { data } = await supabase.from('experiences').select('*').order('sort_order', { ascending: true });
  res.json(data || []);
});

router.post('/experiences', requireAuth, async (req, res) => {
  const { title, subtitle, description, type } = req.body;
  const { data: maxRow } = await supabase.from('experiences').select('sort_order').order('sort_order', { ascending: false }).limit(1).single();
  const maxOrder = (maxRow && maxRow.sort_order) || 0;
  
  const { data, error } = await supabase
    .from('experiences')
    .insert({ title, subtitle, description, type, sort_order: maxOrder + 1 })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, id: data.id });
});

router.put('/experiences/:id', requireAuth, async (req, res) => {
  const { title, subtitle, description, type, sort_order } = req.body;
  await supabase
    .from('experiences')
    .update({ title, subtitle, description, type, sort_order: sort_order || 0 })
    .eq('id', req.params.id);
  res.json({ success: true });
});

router.delete('/experiences/:id', requireAuth, async (req, res) => {
  await supabase.from('experiences').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// ============ DETAILED SKILLS CRUD ============
router.get('/detailed-skills', requireAuth, async (req, res) => {
  const { data } = await supabase.from('detailed_skills').select('*').order('sort_order', { ascending: true });
  res.json(data || []);
});

router.post('/detailed-skills', requireAuth, async (req, res) => {
  const { name, percentage, icon, color } = req.body;
  const { data: maxRow } = await supabase.from('detailed_skills').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const maxOrder = (maxRow && maxRow.sort_order) || 0;
  
  const { data, error } = await supabase
    .from('detailed_skills')
    .insert({ 
      name, 
      percentage: parseInt(percentage) || 0, 
      icon: icon || 'fas fa-star', 
      color: color || '#2563EB',
      sort_order: maxOrder + 1 
    })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, id: data.id });
});

router.put('/detailed-skills/:id', requireAuth, async (req, res) => {
  const { name, percentage, icon, color, sort_order } = req.body;
  const { error } = await supabase
    .from('detailed_skills')
    .update({ 
      name, 
      percentage: parseInt(percentage) || 0, 
      icon, 
      color, 
      sort_order: sort_order || 0 
    })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.delete('/detailed-skills/:id', requireAuth, async (req, res) => {
  await supabase.from('detailed_skills').delete().eq('id', req.params.id);
  res.json({ success: true });
});

module.exports = router;
