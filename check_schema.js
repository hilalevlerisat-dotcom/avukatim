require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function checkSchema() {
  const { data, error } = await supabase.from('documents').select('*').limit(1)
  if (error) {
    console.error('Error:', error.message)
  } else {
    if (data && data.length > 0) {
      console.log('Columns in documents table:', Object.keys(data[0]))
    } else {
      console.log('Table is empty, cannot infer schema from rows.')
      // Alternatively, we can intentionally cause a schema error to see what happens, but we can also use the openapi spec
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)
      const openapi = await res.json()
      console.log('Documents Schema:', openapi.definitions.documents.properties)
    }
  }
}

checkSchema()
