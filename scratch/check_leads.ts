
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

async function checkSchema() {
  if (!supabaseUrl || !supabaseKey) {
    console.log("Missing Supabase env vars")
    return
  }
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase.from('leads').select('*').limit(1)
  if (error) {
    console.error(error)
  } else {
    console.log("Columns:", Object.keys(data[0]))
    console.log("Example data:", data[0])
  }
}

checkSchema()
