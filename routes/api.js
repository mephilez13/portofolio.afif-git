const express = require('express');
const router = express.Router();
const { supabase } = require('../database/db');

// GET all portfolio data (for frontend)
router.get('/portfolio', async (req, res) => {
  try {
    // Parallel fetch for better performance
    const [
      { data: settingsRows, error: settingsError },
      { data: services, error: servicesError },
      { data: projects, error: projectsError },
      { data: testimonials, error: testimonialsError },
      { data: skills, error: skillsError }
    ] = await Promise.all([
      supabase.from('settings').select('key, value'),
      supabase.from('services').select('*').order('sort_order', { ascending: true }),
      supabase.from('projects').select('*').order('sort_order', { ascending: true }),
      supabase.from('testimonials').select('*').order('sort_order', { ascending: true }),
      supabase.from('skills').select('*').order('sort_order', { ascending: true })
    ]);

    if (settingsError || servicesError || projectsError || testimonialsError || skillsError) {
      throw new Error('Supabase query failed');
    }

    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    });

    res.json({
      hero: settings.hero || {},
      about: settings.about || {},
      contact: settings.contact || {},
      siteInfo: settings.siteInfo || {},
      services: services || [],
      projects: projects || [],
      testimonials: testimonials || [],
      skills: skills || []
    });
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/settings/:key', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', req.params.key)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json(typeof data.value === 'string' ? JSON.parse(data.value) : data.value);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/services', async (req, res) => {
  const { data } = await supabase.from('services').select('*').order('sort_order', { ascending: true });
  res.json(data || []);
});

router.get('/projects', async (req, res) => {
  const { data } = await supabase.from('projects').select('*').order('sort_order', { ascending: true });
  res.json(data || []);
});

router.get('/testimonials', async (req, res) => {
  const { data } = await supabase.from('testimonials').select('*').order('sort_order', { ascending: true });
  res.json(data || []);
});

router.get('/skills', async (req, res) => {
  const { data } = await supabase.from('skills').select('*').order('sort_order', { ascending: true });
  res.json(data || []);
});

module.exports = router;
