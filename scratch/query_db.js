require('dotenv').config({ path: 'server/.env' });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

const ids = [
    'd455d0bb-4f73-40f4-a7c9-a4f960027fc5', // Render User ID
    '0b34572f-c1e0-440a-9606-6691f8f06c14'  // Localhost User ID
];

async function check() {
    try {
        const { data: { users }, error: authErr } = await sb.auth.admin.listUsers();
        if (authErr) throw authErr;
        
        console.log('--- SUPABASE AUTH USERS ---');
        users.forEach(u => {
            if (ids.includes(u.id)) {
                console.log(`ID: ${u.id} | Email: ${u.email}`);
            }
        });

        console.log('\n--- USER CREDITS ---');
        const { data: credits, error: credErr } = await sb.from('user_credits').select('*').in('user_id', ids);
        if (credErr) throw credErr;
        console.log(JSON.stringify(credits, null, 2));

        console.log('\n--- TRANSACTION COUNTS ---');
        for (const id of ids) {
            const { count, error: txErr } = await sb.from('credit_transactions').select('*', { count: 'exact', head: true }).eq('user_id', id);
            if (txErr) throw txErr;
            console.log(`User ${id}: ${count} transactions`);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

check();
