const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'portfolio.db');

let db = null;

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function initialize() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'star',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'all',
      image TEXT,
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      content TEXT,
      avatar TEXT,
      rating INTEGER DEFAULT 5,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Seed default admin
  const adminCount = db.exec('SELECT COUNT(*) as count FROM admin_users');
  if (adminCount[0].values[0][0] === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run('INSERT INTO admin_users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
    console.log('✅ Default admin created (username: admin, password: admin123)');
  }

  // Seed default settings
  const settingsCount = db.exec('SELECT COUNT(*) as count FROM settings');
  if (settingsCount[0].values[0][0] === 0) {
    const defaultSettings = {
      hero: JSON.stringify({
        greeting: 'Hello !',
        name: 'Muhammad Afif Alfarizi',
        title: 'Social Media Marketing &',
        titleHighlight: '2D Illustrator',
        description: 'Creative Social Media Marketer and 2D Illustrator with Expertise in Building Engaging Digital Presence and Stunning Visual Content.',
        profileImage: '',
        resumeLink: '#'
      }),
      about: JSON.stringify({
        bio: 'Saya adalah seorang profesional kreatif yang berfokus pada Social Media Marketing dan 2D Illustration. Dengan pengalaman membangun brand presence di berbagai platform digital dan menciptakan visual yang menarik, saya membantu bisnis untuk tumbuh dan tampil menonjol di dunia digital.',
        yearsExperience: '3+',
        projectsCompleted: '50+',
        happyClients: '30+',
        image: ''
      }),
      contact: JSON.stringify({
        email: 'rayhanalfariz45@gmail.com',
        phone: '+62 857-1594-6269',
        whatsapp: '6285715946269',
        website: 'https://afif.theprojects.web.id/',
        address: 'Indonesia',
        instagram: '#',
        linkedin: '#',
        behance: '#',
        dribbble: '#'
      }),
      siteInfo: JSON.stringify({
        logo: 'AA',
        copyright: '© 2026 Muhammad Afif Alfarizi. All Rights Reserved.'
      })
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
    console.log('✅ Default settings seeded');
  }

  // Seed default skills
  const skillsCount = db.exec('SELECT COUNT(*) as count FROM skills');
  if (skillsCount[0].values[0][0] === 0) {
    const skills = [
      'Social Media Marketing', 'Content Creation', '2D Illustration', 'Brand Strategy',
      'Digital Marketing', 'Visual Design', 'Adobe Illustrator', 'Graphic Design'
    ];
    skills.forEach((skill, i) => {
      db.run('INSERT INTO skills (name, sort_order) VALUES (?, ?)', [skill, i]);
    });
    console.log('✅ Default skills seeded');
  }

  // Seed default services
  const servicesCount = db.exec('SELECT COUNT(*) as count FROM services');
  if (servicesCount[0].values[0][0] === 0) {
    const services = [
      { title: 'Social Media Strategy', description: 'Merancang strategi media sosial yang efektif untuk meningkatkan engagement dan pertumbuhan brand Anda di berbagai platform digital.', icon: 'strategy' },
      { title: 'Content Creation', description: 'Membuat konten visual dan copywriting yang menarik dan relevan untuk memperkuat identitas brand di media sosial.', icon: 'content' },
      { title: '2D Illustration', description: 'Menciptakan ilustrasi 2D original dan berkualitas tinggi untuk kebutuhan branding, editorial, dan digital media.', icon: 'illustration' },
      { title: 'Brand Design', description: 'Mendesain identitas visual brand yang konsisten dan memorable, mulai dari logo hingga brand guideline.', icon: 'brand' }
    ];
    services.forEach((s, i) => {
      db.run('INSERT INTO services (title, description, icon, sort_order) VALUES (?, ?, ?, ?)', [s.title, s.description, s.icon, i]);
    });
    console.log('✅ Default services seeded');
  }

  // Seed default projects
  const projectsCount = db.exec('SELECT COUNT(*) as count FROM projects');
  if (projectsCount[0].values[0][0] === 0) {
    const projects = [
      { title: 'Brand Campaign - Coffee Shop', description: 'Social media campaign untuk brand kopi lokal dengan peningkatan engagement 150%.', category: 'marketing', image: '', link: '#' },
      { title: 'Character Design Series', description: 'Seri ilustrasi karakter 2D untuk game indie dengan gaya visual yang unik.', category: 'illustration', image: '', link: '#' },
      { title: 'Instagram Growth Strategy', description: 'Strategi pertumbuhan Instagram dari 0 hingga 10K followers dalam 3 bulan.', category: 'marketing', image: '', link: '#' },
      { title: 'Editorial Illustration', description: 'Ilustrasi editorial untuk majalah digital dengan tema teknologi dan inovasi.', category: 'illustration', image: '', link: '#' },
      { title: 'E-commerce Social Ads', description: 'Desain dan strategi iklan sosial media untuk e-commerce fashion.', category: 'marketing', image: '', link: '#' },
      { title: 'Mascot Design', description: 'Desain maskot 2D untuk startup teknologi edukasi.', category: 'illustration', image: '', link: '#' }
    ];
    projects.forEach((p, i) => {
      db.run('INSERT INTO projects (title, description, category, image, link, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [p.title, p.description, p.category, p.image, p.link, i]);
    });
    console.log('✅ Default projects seeded');
  }

  // Seed default testimonials
  const testimonialsCount = db.exec('SELECT COUNT(*) as count FROM testimonials');
  if (testimonialsCount[0].values[0][0] === 0) {
    const testimonials = [
      { name: 'Rina Sari', role: 'Owner, Kopi Nusantara', content: 'Afif sangat profesional dalam mengelola media sosial bisnis kami. Engagement meningkat drastis dan brand kami semakin dikenal!', rating: 5 },
      { name: 'Budi Santoso', role: 'CEO, TechEdu', content: 'Ilustrasi maskot yang dibuat Afif sangat kreatif dan sesuai dengan visi perusahaan kami. Sangat recommended!', rating: 5 },
      { name: 'Diana Putri', role: 'Marketing Manager, Fashion Co', content: 'Strategi social media ads dari Afif berhasil meningkatkan penjualan online kami hingga 200%. Luar biasa!', rating: 5 }
    ];
    testimonials.forEach((t, i) => {
      db.run('INSERT INTO testimonials (name, role, content, avatar, rating, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [t.name, t.role, t.content, '', t.rating, i]);
    });
    console.log('✅ Default testimonials seeded');
  }

  saveDatabase();
  console.log('✅ Database initialized successfully');
}

// Helper functions to mimic better-sqlite3 API
function getDb() {
  return db;
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryGet(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function queryRun(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0]?.values[0][0] || 0 };
}

function queryExec(sql) {
  return db.exec(sql);
}

module.exports = { initialize, getDb, queryAll, queryGet, queryRun, queryExec, saveDatabase };
