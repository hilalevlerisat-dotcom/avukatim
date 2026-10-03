const fs = require('fs');

const templates = JSON.parse(fs.readFileSync('scripts/dilekce_templates.json', 'utf8'));

let sql = `
-- Create dilekce_templates table
CREATE TABLE IF NOT EXISTS public.dilekce_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dilekce_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users on dilekce_templates" 
ON public.dilekce_templates FOR SELECT 
TO authenticated 
USING (true);

-- Optional: Allow anon read if needed
CREATE POLICY "Allow read access for anon on dilekce_templates" 
ON public.dilekce_templates FOR SELECT 
TO anon 
USING (true);

-- Insert templates
INSERT INTO public.dilekce_templates (category, title, url) VALUES
`;

const values = templates.map(t => {
    const title = t.title.replace(/'/g, "''");
    const cat = t.category.replace(/'/g, "''");
    const url = t.url.replace(/'/g, "''");
    return `('${cat}', '${title}', '${url}')`;
});

sql += values.join(',\n') + ';\n';

fs.writeFileSync('scripts/seed_dilekce_templates.sql', sql);
console.log('SQL file generated at scripts/seed_dilekce_templates.sql');
