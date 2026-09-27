// Supabase Database Types
// Bu dosya veritabanı şemasına göre manuel olarak oluşturulmuştur.
// Supabase CLI ile: npx supabase gen types typescript --linked > lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CaseCategory =
  | 'acik_dava'
  | 'icra'
  | 'savcilik'
  | 'arabuluculuk'
  | 'acilacak_dosya'
  | 'ihtarname'

export type CaseStatus = 'active' | 'closed' | 'pending' | 'archived'
export type ClientType = 'individual' | 'corporate'
export type DeadlineType = 'petition' | 'appeal' | 'response' | 'evidence' | 'payment' | 'other'
export type FinanceType = 'retainer' | 'payment' | 'expense' | 'court_fee' | 'refund'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other'
export type ReminderStatus = 'pending' | 'sent' | 'dismissed'
export type DocumentFileType = 'pdf' | 'image' | 'tiff' | 'udf' | 'docx' | 'xlsx' | 'other'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string
          bar_number: string | null
          bar_city: string | null
          phone: string | null
          office_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      clients: {
        Row: {
          id: string
          user_id: string
          full_name: string
          tc_no: string | null
          company_name: string | null
          client_type: ClientType
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      cases: {
        Row: {
          id: string
          user_id: string
          client_id: string
          case_number: string | null
          title: string
          category: CaseCategory
          status: CaseStatus
          court_name: string | null
          court_file_no: string | null
          opposing_party: string | null
          opposing_counsel: string | null
          open_date: string | null
          close_date: string | null
          enforcement_amount: number | null
          enforcement_office: string | null
          description: string | null
          priority: 1 | 2 | 3
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cases']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cases']['Insert']>
      }
      hearings: {
        Row: {
          id: string
          case_id: string
          user_id: string
          hearing_date: string
          court_name: string | null
          courtroom: string | null
          judge_name: string | null
          result: string | null
          next_hearing: string | null
          is_completed: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['hearings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['hearings']['Insert']>
      }
      deadlines: {
        Row: {
          id: string
          case_id: string
          user_id: string
          title: string
          deadline_type: DeadlineType
          due_date: string
          description: string | null
          is_completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['deadlines']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['deadlines']['Insert']>
      }
      finance_records: {
        Row: {
          id: string
          user_id: string
          client_id: string
          case_id: string | null
          finance_type: FinanceType
          amount: number
          currency: string
          payment_method: PaymentMethod | null
          transaction_date: string
          due_date: string | null
          description: string | null
          receipt_no: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['finance_records']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['finance_records']['Insert']>
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          case_id: string | null
          finance_id: string | null
          title: string
          description: string | null
          remind_at: string
          status: ReminderStatus
          is_recurring: boolean
          recurrence_days: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>
      }
      documents: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          case_id: string | null
          file_name: string
          storage_path: string
          file_type: DocumentFileType
          mime_type: string | null
          file_size: number | null
          description: string | null
          folder_name: string | null
          uploaded_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'uploaded_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
    }
    Views: {
      v_client_financial_summary: {
        Row: {
          client_id: string
          client_name: string
          toplam_vekalet_ucreti: number
          toplam_odeme: number
          toplam_gider: number
          kalan_bakiye: number
          toplam_dosya_sayisi: number
        }
      }
      v_upcoming_events: {
        Row: {
          event_type: 'hearing' | 'deadline' | 'reminder'
          event_id: string
          event_date: string
          case_title: string
          client_name: string
          detail: string
          case_id: string | null
          user_id: string
        }
      }
    }
  }
}

// Convenience types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Case = Database['public']['Tables']['cases']['Row']
export type Hearing = Database['public']['Tables']['hearings']['Row']
export type Deadline = Database['public']['Tables']['deadlines']['Row']
export type FinanceRecord = Database['public']['Tables']['finance_records']['Row']
export type Reminder = Database['public']['Tables']['reminders']['Row']
export type ClientFinancialSummary = Database['public']['Views']['v_client_financial_summary']['Row']
export type UpcomingEvent = Database['public']['Views']['v_upcoming_events']['Row']

// Extended types with joins
export type CaseWithClient = Case & { clients: Pick<Client, 'id' | 'full_name'> }
export type HearingWithCase = Hearing & { cases: Pick<Case, 'id' | 'title'> & { clients: Pick<Client, 'full_name'> } }
export type FinanceWithClient = FinanceRecord & { clients: Pick<Client, 'id' | 'full_name'> }
export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentWithRelations = Document & {
  clients?: Pick<Client, 'id' | 'full_name'> | null
  cases?: Pick<Case, 'id' | 'title'> | null
}

export type ReminderWithRelations = Reminder & {
  clients?: Pick<Client, 'id' | 'full_name'> | null
  cases?: Pick<Case, 'id' | 'title'> | null
}
