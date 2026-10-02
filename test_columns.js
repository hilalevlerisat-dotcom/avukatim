require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const possibleColumns = [
  'id', 'user_id', 'client_id', 'case_id', 'file_name', 'storage_path', 
  'file_type', 'mime_type', 'file_size', 'description', 'folder_name', 
  'uploaded_at', 'updated_at', 'created_at', 'url', 'path', 'name', 'size', 'type'
];

async function testColumns() {
  const existingColumns = [];
  for (const col of possibleColumns) {
    // Try to insert a dummy row with just this column
    // We expect an RLS error (42501) if the column exists, or PGRST204 if it doesn't.
    const { error } = await supabase.from('documents').insert({ [col]: null });
    
    if (error) {
      if (error.code === 'PGRST204') {
        // Column does not exist
      } else if (error.code === '42501' || error.code === '23502') {
        // 42501: RLS denied (meaning column exists and query was parsed)
        // 23502: not-null violation (meaning column exists)
        existingColumns.push(col);
      } else if (error.code === '22P02') {
         // Invalid text representation (meaning column exists but null or string is wrong type, e.g. uuid)
         existingColumns.push(col);
      } else {
        existingColumns.push(col); // Any other error means it passed schema validation
      }
    } else {
      existingColumns.push(col); // Insert succeeded
    }
  }
  console.log('Detected columns:', existingColumns);
}

testColumns();
