import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { parseRequestBody } from '@/lib/request';

export async function POST(request, { params }) {
  const supabase = getSupabaseClient();
  const noteId = Number(params.noteId);
  const body = await parseRequestBody(request);
  const characterId = Number(body.characterId || body.character_id);

  if (!characterId) {
    return NextResponse.json({ message: 'characterId is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('note_characters')
    .insert({ note_id: noteId, character_id: characterId })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: 'Failed to link character to note', error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
