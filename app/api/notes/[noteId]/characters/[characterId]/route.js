import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function DELETE(_request, { params }) {
  const supabase = getSupabaseClient();
  const noteId = Number(params.noteId);
  const characterId = Number(params.characterId);

  const { error } = await supabase
    .from('note_characters')
    .delete()
    .match({ note_id: noteId, character_id: characterId });

  if (error) {
    return NextResponse.json({ message: 'Failed to unlink character from note', error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
