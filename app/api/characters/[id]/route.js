import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { getSupabaseClient } from '@/lib/supabase';
import { normalizeIds, parseRequestBody } from '@/lib/request';
import { toCharacterDtoSingle } from '@/lib/mappers';

async function fetchNotesByIds(supabase, ids) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('notes').select('*').in('id', ids);
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function GET(_request, { params }) {
  const supabase = getSupabaseClient();
  const id = Number(params.id);

  const { data, error } = await supabase.from('characters').select('*').eq('id', id).single();
  if (error) {
    return NextResponse.json({ message: 'Character not found', error: error.message }, { status: 404 });
  }

  const { data: joinedLinks } = await supabase
    .from('note_characters')
    .select('note_id, notes(*)')
    .eq('character_id', id);
  let sessions = (joinedLinks || []).map((row) => row.notes).filter(Boolean);
  if (!sessions.length && (joinedLinks || []).length) {
    const ids = joinedLinks.map((row) => row.note_id);
    sessions = await fetchNotesByIds(supabase, ids);
  }

  return NextResponse.json(toCharacterDtoSingle(data, sessions));
}

export async function PUT(request, { params }) {
  const supabase = getSupabaseClient();
  const id = Number(params.id);
  const body = await parseRequestBody(request);

  const sessionIds = normalizeIds(body.sessionIds || body.sessions);
  const patch = {};
  if (body.name !== undefined) patch.name = sanitizeHtml(body.name);
  if (body.race !== undefined) patch.race = sanitizeHtml(body.race);
  if (body.class !== undefined) patch.class = sanitizeHtml(body.class);
  if (body.status !== undefined) patch.status = body.status ? sanitizeHtml(body.status) : null;
  if (body.location !== undefined) patch.location = body.location ? sanitizeHtml(body.location) : null;
  if (body.backstory !== undefined) patch.backstory = body.backstory ? sanitizeHtml(body.backstory) : null;
  if (body.imageUrl !== undefined || body.image_url !== undefined) {
    patch.image_url = body.imageUrl || body.image_url;
  }
  if (body.playerType !== undefined || body.player_type !== undefined) {
    patch.player_type = sanitizeHtml(body.playerType || body.player_type);
  }

  const { data, error } = await supabase.from('characters').update(patch).eq('id', id).select().single();
  if (error) {
    return NextResponse.json({ message: 'Failed to update character', error: error.message }, { status: 500 });
  }

  if (body.sessionIds !== undefined || body.sessions !== undefined) {
    await supabase.from('note_characters').delete().eq('character_id', id);
    if (sessionIds.length > 0) {
      const linkRows = sessionIds.map((noteId) => ({ note_id: noteId, character_id: id }));
      await supabase.from('note_characters').insert(linkRows);
    }
  }

  const { data: joinedLinks } = await supabase
    .from('note_characters')
    .select('note_id, notes(*)')
    .eq('character_id', id);
  let sessions = (joinedLinks || []).map((row) => row.notes).filter(Boolean);
  if (!sessions.length && (joinedLinks || []).length) {
    const ids = joinedLinks.map((row) => row.note_id);
    sessions = await fetchNotesByIds(supabase, ids);
  }

  return NextResponse.json(toCharacterDtoSingle(data, sessions));
}

export async function DELETE(_request, { params }) {
  const supabase = getSupabaseClient();
  const id = Number(params.id);

  const { error } = await supabase.from('characters').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ message: 'Failed to delete character', error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
