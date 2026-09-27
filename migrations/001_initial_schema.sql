-- ═══════════════════════════════════════════════════════════════════════════════
-- Avukat Asistanım — Supabase Tam Şema Migration (001_initial_schema.sql)
-- Supabase Dashboard → SQL Editor'e yapıştırın ve çalıştırın.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Uzantılar
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUM Türleri
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE case_category AS ENUM (
    'acik_dava', 'icra', 'savcilik', 'arabuluculuk', 'acilacak_dosya', 'ihtarname'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE case_status AS ENUM ('active', 'closed', 'pending', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_type AS ENUM ('individual', 'corporate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE finance_type AS ENUM ('retainer', 'payment', 'expense', 'court_fee', 'refund');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'credit_card', 'check', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deadline_type AS ENUM ('petition', 'appeal', 'response', 'evidence', 'payment', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_file_type AS ENUM ('pdf', 'image', 'tiff', 'udf', 'docx', 'xlsx', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. updated_at otomatik güncelleyici fonksiyon
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Tablolar
-- ─────────────────────────────────────────────────────────────────────────────

-- 3.1 Kullanıcı Profilleri
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  bar_number    TEXT,
  bar_city      TEXT,
  phone         TEXT,
  office_name   TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE OR REPLACE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi profilini görür" ON public.user_profiles;
CREATE POLICY "Kendi profilini görür" ON public.user_profiles
  FOR ALL USING (id = auth.uid());

-- 3.2 Müvekkiller
CREATE TABLE IF NOT EXISTS public.clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  client_type   client_type NOT NULL DEFAULT 'individual',
  tc_no         TEXT,
  company_name  TEXT,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON public.clients(is_active);

CREATE OR REPLACE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi müvekkilleri" ON public.clients;
CREATE POLICY "Kendi müvekkilleri" ON public.clients
  FOR ALL USING (user_id = auth.uid());

-- 3.3 Davalar / Dosyalar
CREATE TABLE IF NOT EXISTS public.cases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  case_number         TEXT,
  title               TEXT NOT NULL,
  category            case_category NOT NULL DEFAULT 'acik_dava',
  status              case_status NOT NULL DEFAULT 'active',
  court_name          TEXT,
  court_file_no       TEXT,
  opposing_party      TEXT,
  opposing_counsel    TEXT,
  open_date           DATE,
  close_date          DATE,
  enforcement_amount  NUMERIC(14,2),
  enforcement_office  TEXT,
  description         TEXT,
  priority            SMALLINT NOT NULL DEFAULT 2 CHECK (priority IN (1,2,3)),
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cases_user_id   ON public.cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_status    ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_category  ON public.cases(category);

CREATE OR REPLACE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi dosyaları" ON public.cases;
CREATE POLICY "Kendi dosyaları" ON public.cases
  FOR ALL USING (user_id = auth.uid());

-- 3.4 Duruşmalar
CREATE TABLE IF NOT EXISTS public.hearings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  hearing_date  TIMESTAMPTZ NOT NULL,
  court_name    TEXT,
  courtroom     TEXT,
  judge_name    TEXT,
  result        TEXT,
  next_hearing  TIMESTAMPTZ,
  is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_hearings_user_id ON public.hearings(user_id);
CREATE INDEX IF NOT EXISTS idx_hearings_date    ON public.hearings(hearing_date);

ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi duruşmaları" ON public.hearings;
CREATE POLICY "Kendi duruşmaları" ON public.hearings
  FOR ALL USING (user_id = auth.uid());

-- 3.5 Süreler / Takvim Hareketleri
CREATE TABLE IF NOT EXISTS public.deadlines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id        UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  deadline_type  deadline_type NOT NULL DEFAULT 'other',
  due_date       TIMESTAMPTZ NOT NULL,
  description    TEXT,
  is_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deadlines_case_id  ON public.deadlines(case_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_user_id  ON public.deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON public.deadlines(due_date);

ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi süreleri" ON public.deadlines;
CREATE POLICY "Kendi süreleri" ON public.deadlines
  FOR ALL USING (user_id = auth.uid());

-- 3.6 Finans Kayıtları
CREATE TABLE IF NOT EXISTS public.finance_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  case_id          UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  finance_type     finance_type NOT NULL,
  amount           NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency         TEXT NOT NULL DEFAULT 'TRY',
  payment_method   payment_method,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE,
  description      TEXT,
  receipt_no       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_finance_user_id    ON public.finance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_client_id  ON public.finance_records(client_id);
CREATE INDEX IF NOT EXISTS idx_finance_case_id    ON public.finance_records(case_id);
CREATE INDEX IF NOT EXISTS idx_finance_type       ON public.finance_records(finance_type);
CREATE INDEX IF NOT EXISTS idx_finance_date       ON public.finance_records(transaction_date);

CREATE OR REPLACE TRIGGER trg_finance_updated_at
  BEFORE UPDATE ON public.finance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi finans kayıtları" ON public.finance_records;
CREATE POLICY "Kendi finans kayıtları" ON public.finance_records
  FOR ALL USING (user_id = auth.uid());

-- 3.7 Hatırlatıcılar
CREATE TABLE IF NOT EXISTS public.reminders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  case_id          UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  finance_id       UUID REFERENCES public.finance_records(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  remind_at        TIMESTAMPTZ NOT NULL,
  status           reminder_status NOT NULL DEFAULT 'pending',
  is_recurring     BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_days  INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id   ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON public.reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status    ON public.reminders(status);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi hatırlatıcıları" ON public.reminders;
CREATE POLICY "Kendi hatırlatıcıları" ON public.reminders
  FOR ALL USING (user_id = auth.uid());

-- 3.8 Evrak / Belgeler
CREATE TABLE IF NOT EXISTS public.documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  client_id      UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  case_id        UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  file_name      TEXT NOT NULL,
  storage_path   TEXT NOT NULL UNIQUE,
  file_type      document_file_type NOT NULL DEFAULT 'other',
  mime_type      TEXT,
  file_size      BIGINT,
  description    TEXT,
  folder_name    TEXT,
  uploaded_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id   ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id   ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON public.documents(file_type);

CREATE OR REPLACE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi belgeleri" ON public.documents;
CREATE POLICY "Kendi belgeleri" ON public.documents
  FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. View'lar (Raporlama)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_client_financial_summary AS
SELECT
  c.id                                                          AS client_id,
  c.full_name                                                   AS client_name,
  COALESCE(SUM(CASE WHEN fr.finance_type = 'retainer' THEN fr.amount ELSE 0 END), 0) AS toplam_vekalet_ucreti,
  COALESCE(SUM(CASE WHEN fr.finance_type = 'payment'  THEN fr.amount ELSE 0 END), 0) AS toplam_odeme,
  COALESCE(SUM(CASE WHEN fr.finance_type IN ('expense','court_fee') THEN fr.amount ELSE 0 END), 0) AS toplam_gider,
  COALESCE(SUM(CASE WHEN fr.finance_type = 'retainer' THEN fr.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN fr.finance_type = 'payment' THEN fr.amount ELSE 0 END), 0) AS kalan_bakiye,
  COUNT(DISTINCT cs.id)                                         AS toplam_dosya_sayisi
FROM public.clients c
LEFT JOIN public.finance_records fr ON fr.client_id = c.id
LEFT JOIN public.cases cs ON cs.client_id = c.id
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.full_name;

CREATE OR REPLACE VIEW public.v_upcoming_events AS
SELECT
  'hearing'::TEXT AS event_type, h.id AS event_id, h.hearing_date AS event_date,
  cs.title AS case_title, cl.full_name AS client_name,
  COALESCE(h.court_name, 'Mahkeme') AS detail, h.case_id, h.user_id
FROM public.hearings h
JOIN public.cases cs ON cs.id = h.case_id
JOIN public.clients cl ON cl.id = cs.client_id
WHERE h.is_completed = FALSE AND h.hearing_date >= NOW() AND h.user_id = auth.uid()
UNION ALL
SELECT
  'deadline'::TEXT, d.id, d.due_date, cs.title, cl.full_name, d.title, d.case_id, d.user_id
FROM public.deadlines d
JOIN public.cases cs ON cs.id = d.case_id
JOIN public.clients cl ON cl.id = cs.client_id
WHERE d.is_completed = FALSE AND d.due_date >= NOW() AND d.user_id = auth.uid()
UNION ALL
SELECT
  'reminder'::TEXT, r.id, r.remind_at,
  COALESCE(cs.title, 'Genel'), COALESCE(cl.full_name, '-'), r.title, r.case_id, r.user_id
FROM public.reminders r
LEFT JOIN public.cases cs ON cs.id = r.case_id
LEFT JOIN public.clients cl ON cl.id = r.client_id
WHERE r.status = 'pending' AND r.remind_at >= NOW() AND r.user_id = auth.uid()
ORDER BY event_date ASC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Yeni Kullanıcıda Profil Otomatik Oluşturma Trigger'ı
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Yeni Kullanıcı'),
    NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Storage Bucket (Manuel adım — Dashboard üzerinden yapın)
-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Dashboard → Storage → "New Bucket":
--   Ad: avukat-documents | Public: HAYIR | Max boyut: 50 MB
--   MIME: application/pdf, image/*, application/zip, application/vnd.openxmlformats-officedocument.*
-- Storage → Policies → RLS ekle:
--   SELECT/INSERT/DELETE: (storage.foldername(name))[1] = auth.uid()::text

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TRUNCATE (Sadece test verilerini sıfırlarken kullanın)
-- ─────────────────────────────────────────────────────────────────────────────
-- TRUNCATE public.documents       RESTART IDENTITY CASCADE;
-- TRUNCATE public.reminders       RESTART IDENTITY CASCADE;
-- TRUNCATE public.finance_records RESTART IDENTITY CASCADE;
-- TRUNCATE public.deadlines       RESTART IDENTITY CASCADE;
-- TRUNCATE public.hearings        RESTART IDENTITY CASCADE;
-- TRUNCATE public.cases           RESTART IDENTITY CASCADE;
-- TRUNCATE public.clients         RESTART IDENTITY CASCADE;
-- TRUNCATE public.user_profiles   RESTART IDENTITY CASCADE;
