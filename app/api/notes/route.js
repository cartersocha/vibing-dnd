import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { getSupabaseClient } from '@/lib/supabase';
import { mergeNotesWithCharacters, toNoteDtoSingle } from '@/lib/mappers';
import { normalizeIds, parseRequestBody } from '@/lib/request';

export async function GET() {
  const supabase = getSupabaseClient();

  const [{ data: notes, error: notesError }, { data: characters, error: charactersError }, { data: noteLinks, error: linksError }] = await Promise.all([
    supabase.from('notes').select('*').order('id', { ascending: false }),
    supabase.from('characters').select('*'),
    supabase.from('note_characters').select('note_id, character_id'),
  ]);

  if (notesError || charactersError || linksError) {
    return NextResponse.json(
      {
        message: 'Failed to fetch notes',
        error: notesError?.message || charactersError?.message || linksError?.message,
      },
      { status: 500 },
    );
  }

  const merged = mergeNotesWithCharacters(notes || [], noteLinks || [], characters || []);
  return NextResponse.json(merged);
}

async function fetchCharactersByIds(supabase, ids) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('characters').select('*').in('id', ids);
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function POST(request) {
  const body = await parseRequestBody(request);
  const supabase = getSupabaseClient();

  const characterIds = normalizeIds(body.characterIds || body.characters);
  const payload = {
    title: sanitizeHtml(body.title || ''),
    date: body.date,
    content: sanitizeHtml(body.content || ''),
    image_url: body.imageUrl || body.image_url || null,
  };

  const { data, error } = await supabase.from('notes').insert(payload).select().single();
  if (error) {
    return NextResponse.json({ message: 'Failed to create note', error: error.message }, { status: 500 });
  }

  if (characterIds.length > 0) {
    const linkRows = characterIds.map((characterId) => ({
      note_id: data.id,
      character_id: characterId,
    }));
    const { error: linkError } = await supabase.from('note_characters').insert(linkRows);
    if (linkError) {
      return NextResponse.json({ message: 'Note created but linking characters failed', error: linkError.message }, { status: 207 });
    }
  }

  const { data: joinedLinks } = await supabase
    .from('note_characters')
    .select('character_id, characters(*)')
    .eq('note_id', data.id);

  let characters = (joinedLinks || []).map((row) => row.characters).filter(Boolean);
  if (!characters.length && (joinedLinks || []).length) {
    const ids = joinedLinks.map((row) => row.character_id);
    characters = await fetchCharactersByIds(supabase, ids);
  }

  return NextResponse.json(toNoteDtoSingle(data, characters));
}
