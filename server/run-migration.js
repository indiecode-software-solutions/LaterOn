require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

async function runMigration() {
  console.log('Checking current schema state...\n');

  // Check if migration is already applied by querying the schedules table
  const { error: schedulesError } = await supabase
    .from('schedules')
    .select('channel')
    .limit(1);

  const channelExists = schedulesError && schedulesError.code === 'PGRST204'
    ? false  // column doesn't exist
    : !schedulesError || (schedulesError && schedulesError.code !== 'PGRST204');
  
  if (schedulesError) {
    console.log(`  schedules.channel: ${schedulesError.code === 'PGRST204' ? 'MISSING' : 'EXISTS (error: ' + schedulesError.code + ')'}`);
  } else {
    console.log('  schedules.channel: EXISTS');
  }
  
  // Check user_integrations table  
  const { error: integrationsError } = await supabase
    .from('user_integrations')
    .select('id')
    .limit(1);

  const tableExists = !integrationsError || (integrationsError && integrationsError.code !== '42P01');
  console.log(`  user_integrations table: ${!integrationsError ? 'EXISTS' : integrationsError.code === '42P01' ? 'MISSING' : 'UNKNOWN'}`);

  // Try to apply via direct REST API call to Supabase's sql endpoint
  const sqlPath = path.join(__dirname, 'migrations', '002_add_channel_support.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('\nAttempting to apply via REST API...');
  
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
      console.log('✓ Migration applied successfully!');
    } else {
      const text = await response.text();
      console.log(`  SQL endpoint returned ${response.status}: ${text.slice(0, 200)}`);
      throw new Error('SQL endpoint not available');
    }
  } catch (err) {
    console.log(`  Direct SQL endpoint failed: ${err.message}`);
    
    // Final fallback: print instructions
    console.log('\n⚠  Could not apply migration automatically.');
    console.log(`\nTo apply manually:`);
    console.log(`  1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log(`  2. Paste the contents of: ${sqlPath}`);
    console.log('  3. Click "Run"\n');

    console.log('Migration SQL:');
    console.log(sql);
  }
}

runMigration().catch(console.error);
