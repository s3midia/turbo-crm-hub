const SUPABASE_URL = "https://hnxrukuwmgjucjkkabru.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueHJ1a3V3bWdqdWNqa2thYnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDc3MDQsImV4cCI6MjA4NDgyMzcwNH0.vQgmulqkjBXIzH4YBn1se0itViSqYcm46aA5BsF8g_E";

async function listTables() {
  try {
    const tablesToCheck = ['leads', 'opportunities', 'profiles', 'financial_transactions', 'company_investments', 'company_employees'];
    
    for (const table of tablesToCheck) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (response.ok) {
            console.log(`✅ Table ${table} exists.`);
            if (table === 'leads') {
                const data = await response.json();
                if (data.length > 0) {
                    console.log(`   Columns in leads:`, Object.keys(data[0]));
                }
            }
        } else {
            const err = await response.json().catch(() => ({message: 'Unknown error'}));
            console.log(`❌ Table ${table} NOT found or error:`, err.message);
        }
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

listTables();
