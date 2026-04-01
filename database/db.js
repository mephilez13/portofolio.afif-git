require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or Key missing in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initialize() {
  // Verifikasi koneksi sederhana
  const { data, error } = await supabase.from('settings').select('key').limit(1);
  if (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    console.log('💡 Pastikan Anda sudah menjalankan script SQL di Dashboard Supabase.');
  } else {
    console.log('✅ Supabase connected successfully');
  }
}

module.exports = { supabase, initialize };
