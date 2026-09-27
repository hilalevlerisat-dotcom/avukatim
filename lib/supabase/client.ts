import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return (
    !!url &&
    !!key &&
    url.startsWith('http') &&
    !url.includes('your_supabase_project_url')
  )
}

export function createClient() {
  if (isSupabaseConfigured()) {
    try {
      return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    } catch (e) {
      console.warn('Supabase client init failed, using mock client', e)
    }
  }

  // Safe mock client when Supabase is not configured
  const mockStorageBucket = {
    upload: async (path: string, file: any) => ({ data: { path }, error: null }),
    createSignedUrl: async (path: string) => ({ data: { signedUrl: null }, error: null }),
    remove: async (paths: string[]) => ({ data: null, error: null }),
    getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
  }

  const mockQueryBuilder = {
    insert: (values: any) => ({
      select: () => ({
        single: async () => ({
          data: {
            id: crypto.randomUUID(),
            ...values,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    }),
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
  }

  return {
    storage: {
      from: () => mockStorageBucket,
    },
    from: () => mockQueryBuilder,
  } as any
}
