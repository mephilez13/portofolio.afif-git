require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

// Only create client if URL and Key are provided to prevent crash on Vercel startup
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('❌ Failed to create Supabase client:', err.message);
  }
} else {
  console.warn('⚠️ Supabase credentials missing. Database operations will fail.');
}

async function initialize() {
  if (!supabase) return;
  
  // Verification without blocking too long
  const { error } = await supabase.from('settings').select('key').limit(1).maybeSingle();
  if (error) {
    console.error('❌ Supabase connection check failed:', error.message);
  } else {
    console.log('✅ Supabase connected successfully');
  }
}

module.exports = { supabase, initialize };
