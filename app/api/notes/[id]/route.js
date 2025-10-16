import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { getSupabaseClient } from '@/lib/supabase';
import { normalizeIds, parseRequestBody } from '@/lib/request';
import { toNoteDtoSingle } from '@/lib/mappers';

async function fetchCharactersByIds(supabase, ids) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('characters').select('*').in('id', ids);
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function GET(_request, { params }) {
  const supabase = getSupabaseClient();
  const id = Number(params.id);

  const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
  if (error) {
    return NextResponse.json({ message: 'Note not found', error: error.message }, { status: 404 });
  }

  const { data: joinedLinks } = await supabase
    .from('note_characters')
    .select('character_id, characters(*)')
    .eq('note_id', id);
  let characters = (joinedLinks || []).map((row) => row.characters).filter(Boolean);
  if (!characters.length && (joinedLinks || []).length) {
    const ids = joinedLinks.map((row) => row.character_id);
    characters = await fetchCharactersByIds(supabase, ids);
  }

  return NextResponse.json(toNoteDtoSingle(data, characters));
}

export async function PUT(request, { params }) {
  const supabase = getSupabaseClient();
  const id = Number(params.id);
  const body = await parseRequestBody(request);

  const characterIds = normalizeIds(body.characterIds || body.characters);
  const payload = {};
  if (body.title !== undefined) payload.title = sanitizeHtml(body.title);
  if (body.date !== undefined) payload.date = body.date;
  if (body.content !== undefined) payload.content = sanitizeHtml(body.content);
  if (body.imageUrl !== undefined || body.image_url !== undefined) {
    payload.image_url = body.imageUrl || body.image_url;
  }

  const { data, error } = await supabase.from('notes').update(payload).eq('id', id).select().single();
  if (error) {
    return NextResponse.json({ message: 'Failed to update note', error: error.message }, { status: 500 });
  }

  if (body.characterIds !== undefined || body.characters !== undefined) {
    await supabase.from('note_characters').delete().eq('note_id', id);
    if (characterIds.length > 0) {
      const linkRows = characterIds.map((characterId) => ({ note_id: id, character_id: characterId }));
      await supabase.from('note_characters').insert(linkRows);
    }
  }

  const { data: joinedLinks } = await supabase
    .from('note_characters')
    .select('character_id, characters(*)')
    .eq('note_id', id);
  let characters = (joinedLinks || []).map((row) => row.characters).filter(Boolean);
  if (!characters.length && (joinedLinks || []).length) {
    const ids = joinedLinks.map((row) => row.character_id);
    characters = await fetchCharactersByIds(supabase, ids);
  }

  return NextResponse.json(toNoteDtoSingle(data, characters));
}

export async function DELETE(_request, { params }) {
  const supabase = getSupabaseClient();
  const id = Number(params.id);

  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ message: 'Failed to delete note', error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
