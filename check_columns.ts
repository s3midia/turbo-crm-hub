import { supabase } from './src/integrations/supabase/client';

async function checkColumns() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching leads:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in leads table:', Object.keys(data[0]));
  } else {
    console.log('No data in leads table to check columns.');
  }
}

checkColumns();
