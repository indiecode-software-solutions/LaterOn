const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const pg = require('pg');

const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL in env');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
const sqlPath = path.join(__dirname, 'migrations', '006_create_user_devices_table.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  console.log(`Connecting to Supabase DB: db.${projectRef}.supabase.co...`);
  // Try connecting with password from env if exists, otherwise fallback to 'postgres'
  const password = process.env.SUPABASE_DB_PASSWORD || 'postgres';
  const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
  
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    await client.query(sql);
    console.log('✓ Migration 006 applied successfully via direct PostgreSQL connection!');
    await client.end();
  } catch (err) {
    console.error(`PostgreSQL connection failed: ${err.message}`);
    console.log(`\nPlease apply manually in Supabase Dashboard:`);
    console.log(`  1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log(`  2. Paste the contents of: ${sqlPath}`);
    console.log('  3. Click "Run"\n');
    process.exit(1);
  }
}

run();
