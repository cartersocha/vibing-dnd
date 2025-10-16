import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { getSupabaseClient } from '@/lib/supabase';
import { mergeCharactersWithNotes, toCharacterDtoSingle } from '@/lib/mappers';
import { normalizeIds, parseRequestBody } from '@/lib/request';

async function fetchNotesByIds(supabase, ids) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('notes').select('*').in('id', ids);
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function GET() {
  const supabase = getSupabaseClient();

  const [{ data: characters, error: charactersError }, { data: notes, error: notesError }, { data: links, error: linksError }] = await Promise.all([
    supabase.from('characters').select('*').order('name'),
    supabase.from('notes').select('*'),
    supabase.from('note_characters').select('note_id, character_id'),
  ]);

  if (charactersError || notesError || linksError) {
    return NextResponse.json(
      {
        message: 'Failed to fetch characters',
        error: charactersError?.message || notesError?.message || linksError?.message,
      },
      { status: 500 },
    );
  }

  const merged = mergeCharactersWithNotes(characters || [], links || [], notes || []);
  return NextResponse.json(merged);
}

export async function POST(request) {
  const supabase = getSupabaseClient();
  const body = await parseRequestBody(request);

  const sessionIds = normalizeIds(body.sessionIds || body.sessions);
  const payload = {
    name: sanitizeHtml(body.name || ''),
    race: sanitizeHtml(body.race || ''),
    class: sanitizeHtml(body.class || ''),
    status: body.status ? sanitizeHtml(body.status) : null,
    location: body.location ? sanitizeHtml(body.location) : null,
    backstory: body.backstory ? sanitizeHtml(body.backstory) : null,
    image_url: body.imageUrl || body.image_url || null,
    player_type: sanitizeHtml(body.playerType || body.player_type || 'npc'),
  };

  const { data, error } = await supabase.from('characters').insert(payload).select().single();
  if (error) {
    return NextResponse.json({ message: 'Failed to create character', error: error.message }, { status: 500 });
  }

  if (sessionIds.length > 0) {
    const linkRows = sessionIds.map((noteId) => ({ note_id: noteId, character_id: data.id }));
    await supabase.from('note_characters').insert(linkRows);
  }

  const { data: joinedLinks } = await supabase
    .from('note_characters')
    .select('note_id, notes(*)')
    .eq('character_id', data.id);
  let sessions = (joinedLinks || []).map((row) => row.notes).filter(Boolean);
  if (!sessions.length && (joinedLinks || []).length) {
    const ids = joinedLinks.map((row) => row.note_id);
    sessions = await fetchNotesByIds(supabase, ids);
  }

  return NextResponse.json(toCharacterDtoSingle(data, sessions));
}
