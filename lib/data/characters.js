import sanitizeHtml from 'sanitize-html';
import { getSupabaseServerClient } from '../supabase';
import { mapCharacter, mapNote, applySessionNumbers } from './transform';

export async function fetchCharactersWithRelations() {
  const supabase = getSupabaseServerClient();
  const [charactersRes, notesRes, linksRes] = await Promise.all([
    supabase.from('characters').select('*').order('name', { ascending: true }),
    supabase.from('notes').select('*'),
    supabase.from('note_characters').select('*')
  ]);

  if (charactersRes.error) throw new Error(charactersRes.error.message);
  if (notesRes.error) throw new Error(notesRes.error.message);
  if (linksRes.error) throw new Error(linksRes.error.message);

  const notes = applySessionNumbers((notesRes.data || []).map((row) => mapNote(row)));
  const noteMap = new Map(notes.map((note) => [note.id, note]));

  return (charactersRes.data || []).map((row) => {
    const characterSessions = (linksRes.data || [])
      .filter((link) => link.character_id === row.id)
      .map((link) => noteMap.get(link.note_id))
      .filter(Boolean)
      .sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));
    return mapCharacter(row, characterSessions);
  });
}

export async function fetchCharacterById(id) {
  const supabase = getSupabaseServerClient();
  const characterRes = await supabase.from('characters').select('*').eq('id', id).single();
  if (characterRes.error) {
    if (characterRes.error.code === 'PGRST116') return null;
    throw new Error(characterRes.error.message);
  }

  const linksRes = await supabase
    .from('note_characters')
    .select('note_id')
    .eq('character_id', id);
  if (linksRes.error) throw new Error(linksRes.error.message);

  const noteIds = (linksRes.data || []).map((row) => row.note_id);
  let sessions = [];
  if (noteIds.length > 0) {
    const notesRes = await supabase
      .from('notes')
      .select('*')
      .in('id', noteIds);
    if (notesRes.error) throw new Error(notesRes.error.message);
    sessions = applySessionNumbers((notesRes.data || []).map((row) => mapNote(row)));
  }

  return mapCharacter(characterRes.data, sessions);
}

export async function createCharacter({
  name,
  race,
  class: klass,
  status,
  location,
  backstory,
  imageUrl = null,
  playerType,
  sessionIds = []
}) {
  const supabase = getSupabaseServerClient();
  const clean = {
    name: sanitizeHtml(name || ''),
    race: sanitizeHtml(race || ''),
    class: sanitizeHtml(klass || ''),
    status: status ? sanitizeHtml(status) : null,
    location: location ? sanitizeHtml(location) : null,
    backstory: backstory ? sanitizeHtml(backstory) : null,
    image_url: imageUrl,
    player_type: playerType ? sanitizeHtml(playerType) : null
  };

  const insertRes = await supabase.from('characters').insert(clean).select().single();
  if (insertRes.error) throw new Error(insertRes.error.message);

  if (sessionIds.length > 0) {
    await setCharacterSessions(insertRes.data.id, sessionIds);
  }

  return fetchCharacterById(insertRes.data.id);
}

export async function updateCharacter(id, {
  name,
  race,
  class: klass,
  status,
  location,
  backstory,
  imageUrl,
  playerType,
  sessionIds
}) {
  const supabase = getSupabaseServerClient();
  const patch = {};

  if (name !== undefined) patch.name = sanitizeHtml(name);
  if (race !== undefined) patch.race = sanitizeHtml(race);
  if (klass !== undefined) patch.class = sanitizeHtml(klass);
  if (status !== undefined) patch.status = status ? sanitizeHtml(status) : null;
  if (location !== undefined) patch.location = location ? sanitizeHtml(location) : null;
  if (backstory !== undefined) patch.backstory = backstory ? sanitizeHtml(backstory) : null;
  if (imageUrl !== undefined) patch.image_url = imageUrl;
  if (playerType !== undefined) patch.player_type = sanitizeHtml(playerType);

  if (Object.keys(patch).length > 0) {
    const updateRes = await supabase.from('characters').update(patch).eq('id', id);
    if (updateRes.error) throw new Error(updateRes.error.message);
  }

  if (Array.isArray(sessionIds)) {
    await setCharacterSessions(id, sessionIds);
  }

  return fetchCharacterById(id);
}

export async function deleteCharacter(id) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('characters').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setCharacterSessions(characterId, sessionIds) {
  const supabase = getSupabaseServerClient();
  const existingRes = await supabase
    .from('note_characters')
    .select('note_id')
    .eq('character_id', characterId);
  if (existingRes.error) throw new Error(existingRes.error.message);

  const existingIds = new Set((existingRes.data || []).map((row) => row.note_id));
  const desiredIds = new Set(sessionIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)));

  const toAdd = [...desiredIds].filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !desiredIds.has(id));

  if (toAdd.length > 0) {
    const insertRes = await supabase
      .from('note_characters')
      .insert(toAdd.map((noteId) => ({ note_id: noteId, character_id: characterId })));
    if (insertRes.error) throw new Error(insertRes.error.message);
  }

  if (toRemove.length > 0) {
    const deleteRes = await supabase
      .from('note_characters')
      .delete()
      .eq('character_id', characterId)
      .in('note_id', toRemove);
    if (deleteRes.error) throw new Error(deleteRes.error.message);
  }
}
