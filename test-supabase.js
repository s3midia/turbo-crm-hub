import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://adghrwjfwqeiozxofvyi.supabase.co";
const supabaseKey = "sb_publishable_iINl0usQSwDs9fPxxcwKJQ_Ldv33yvv";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('api_manager').select('*');
  if (error) {
    console.log("Error querying api_manager:", error.message);
  } else {
    console.log("api_manager rows:", data);
  }
}

test();
