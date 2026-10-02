import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const limit = Number(searchParams.get('limit') || '50');

    const supabase = await createClient();

    let query = (supabase.from('emsal_kararlar') as any)
      .select('id, daire, esas_no, karar_no, karar_tarihi, konu, ozet, metin, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (q && q.trim()) {
      const term = q.trim();
      query = query.or(`konu.ilike.%${term}%,ozet.ilike.%${term}%,daire.ilike.%${term}%,esas_no.ilike.%${term}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0, decisions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parametresi zorunludur.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await (supabase.from('emsal_kararlar') as any)
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Karar başarıyla silindi.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
