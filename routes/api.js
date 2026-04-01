const express = require('express');
const router = express.Router();
const { queryAll, queryGet } = require('../database/db');

// GET all portfolio data (for frontend)
router.get('/portfolio', (req, res) => {
  try {
    const settingsRows = queryAll('SELECT key, value FROM settings');
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = JSON.parse(row.value);
    });

    const services = queryAll('SELECT * FROM services ORDER BY sort_order ASC');
    const projects = queryAll('SELECT * FROM projects ORDER BY sort_order ASC');
    const testimonials = queryAll('SELECT * FROM testimonials ORDER BY sort_order ASC');
    const skills = queryAll('SELECT * FROM skills ORDER BY sort_order ASC');

    res.json({
      hero: settings.hero || {},
      about: settings.about || {},
      contact: settings.contact || {},
      siteInfo: settings.siteInfo || {},
      services,
      projects,
      testimonials,
      skills
    });
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/settings/:key', (req, res) => {
  try {
    const row = queryGet('SELECT value FROM settings WHERE key = ?', [req.params.key]);
    if (row) {
      res.json(JSON.parse(row.value));
    } else {
      res.status(404).json({ error: 'Setting not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/services', (req, res) => {
  res.json(queryAll('SELECT * FROM services ORDER BY sort_order ASC'));
});

router.get('/projects', (req, res) => {
  res.json(queryAll('SELECT * FROM projects ORDER BY sort_order ASC'));
});

router.get('/testimonials', (req, res) => {
  res.json(queryAll('SELECT * FROM testimonials ORDER BY sort_order ASC'));
});

router.get('/skills', (req, res) => {
  res.json(queryAll('SELECT * FROM skills ORDER BY sort_order ASC'));
});

module.exports = router;
