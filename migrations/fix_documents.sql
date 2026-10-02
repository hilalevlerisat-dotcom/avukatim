-- Eksik olan sütunları documents tablosuna ekler (Eğer yoklarsa)
DO $$ 
BEGIN 
  -- file_type enum'unu oluştur (eğer yoksa)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_file_type') THEN
    CREATE TYPE document_file_type AS ENUM ('pdf', 'image', 'tiff', 'udf', 'docx', 'xlsx', 'other');
  END IF;
END $$;

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS file_type document_file_type NOT NULL DEFAULT 'other',
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS folder_name TEXT;

-- Şema önbelleğini (schema cache) yenile
NOTIFY pgrst, 'reload schema';
