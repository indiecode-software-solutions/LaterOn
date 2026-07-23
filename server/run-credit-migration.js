require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in env');
  process.exit(1);
}

// Pass WebSocket wrapper to prevent real-time initialization errors in Node 20
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket }
});

async function run() {
  const sqlPath = path.join(__dirname, 'migrations', '004_credit_system.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Sending migration query to Supabase via RPC or Direct SQL query...');
  
  const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
  console.log(`Project Reference: ${projectRef}`);
  
  try {
    const response = await fetch(`https://db.${projectRef}.supabase.co/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
      }
    });
    console.log(`DB connection check status: ${response.status}`);
  } catch (e) {
    console.log(`DB connection check failed: ${e.message}`);
  }

  try {
    const pg = require('pg');
    console.log('pg package is available. Connecting to DB directly...');
    const connectionString = `postgresql://postgres:${encodeURIComponent('postgres')}@db.${projectRef}.supabase.co:5432/postgres`;
    const client = new pg.Client({ connectionString });
    await client.connect();
    await client.query(sql);
    console.log('✓ Migration applied successfully via direct PostgreSQL connection!');
    await client.end();
    return;
  } catch (err) {
    console.log(`PostgreSQL connection failed: ${err.message}`);
  }

  console.log('\n⚠  Could not apply migration automatically via direct connections.');
  console.log(`\nPlease apply manually in Supabase Dashboard:`);
  console.log(`  1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log(`  2. Paste the contents of: ${sqlPath}`);
  console.log('  3. Click "Run"\n');
  console.log('Migration SQL:');
  console.log(sql);
}

run();
