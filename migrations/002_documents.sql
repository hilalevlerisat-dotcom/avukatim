-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Documents (Evrak/Belge) tablosu
-- Supabase SQL Editor'e yapıştırın
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE document_file_type AS ENUM (
  'pdf', 'image', 'tiff', 'udf', 'docx', 'xlsx', 'other'
);

CREATE TABLE public.documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  client_id      UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  case_id        UUID REFERENCES public.cases(id) ON DELETE SET NULL,

  -- Dosya bilgileri
  file_name      TEXT NOT NULL,           -- Orijinal dosya adı
  storage_path   TEXT NOT NULL UNIQUE,    -- Supabase Storage tam yolu
  file_type      document_file_type NOT NULL DEFAULT 'other',
  mime_type      TEXT,
  file_size      BIGINT,                  -- Byte cinsinden

  -- Sınıflandırma
  description    TEXT,
  folder_name    TEXT,                    -- Kaynak klasör adı (sürükle-bırak)

  -- Meta
  uploaded_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id    ON public.documents(user_id);
CREATE INDEX idx_documents_client_id  ON public.documents(client_id);
CREATE INDEX idx_documents_case_id    ON public.documents(case_id);
CREATE INDEX idx_documents_file_type  ON public.documents(file_type);

-- RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kendi belgelerini görür" ON public.documents
  FOR ALL USING (user_id = auth.uid());

-- updated_at trigger
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Supabase Storage Bucket ─────────────────────────────────────────────────
-- Aşağıdaki komutu Supabase Dashboard > Storage > New Bucket ile yapın:
-- Bucket adı: avukat-documents
-- Public: HAYIR (private)
-- Dosya boyutu limiti: 50 MB
-- Allowed MIME types: application/pdf, image/*, application/zip, application/vnd.openxmlformats-officedocument.*

-- Storage RLS Politikaları (Dashboard > Storage > Policies'ten ekleyin):
-- SELECT: (storage.foldername(name))[1] = auth.uid()::text
-- INSERT: (storage.foldername(name))[1] = auth.uid()::text
-- DELETE: (storage.foldername(name))[1] = auth.uid()::text
