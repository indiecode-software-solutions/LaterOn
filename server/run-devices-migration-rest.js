const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in env');
  process.exit(1);
}

const sqlPath = path.join(__dirname, 'migrations', '006_create_user_devices_table.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  console.log('Applying migration via Supabase REST SQL endpoint...');
  try {
    const response = await fetch(`${SUPABASE_URL}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✓ Migration applied successfully via REST SQL endpoint!');
    } else {
      const text = await response.text();
      console.error(`Failed to apply migration via REST: ${response.status} - ${text}`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`REST SQL request failed: ${e.message}`);
    process.exit(1);
  }
}

run();
