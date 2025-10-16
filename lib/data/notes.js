import sanitizeHtml from 'sanitize-html';
import { getSupabaseServerClient } from '../supabase';
import { mapNote, mapCharacter, applySessionNumbers } from './transform';

function sanitizeContent(value) {
  return sanitizeHtml(value || '', {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title']
    }
  });
}

export async function fetchNotesWithRelations() {
  const supabase = getSupabaseServerClient();

  const [notesRes, charactersRes, linksRes] = await Promise.all([
    supabase.from('notes').select('*').order('id', { ascending: false }),
    supabase.from('characters').select('*'),
    supabase.from('note_characters').select('*')
  ]);

  if (notesRes.error) throw new Error(notesRes.error.message);
  if (charactersRes.error) throw new Error(charactersRes.error.message);
  if (linksRes.error) throw new Error(linksRes.error.message);

  const characterMap = new Map(
    (charactersRes.data || []).map((row) => [row.id, mapCharacter(row)])
  );

  const notes = (notesRes.data || []).map((row) => {
    const noteCharacters = (linksRes.data || [])
      .filter((link) => link.note_id === row.id)
      .map((link) => characterMap.get(link.character_id))
      .filter(Boolean);
    return mapNote(row, noteCharacters);
  });

  return applySessionNumbers(notes);
}

export async function fetchNoteById(id) {
  const supabase = getSupabaseServerClient();
  const noteRes = await supabase.from('notes').select('*').eq('id', id).single();
  if (noteRes.error) {
    if (noteRes.error.code === 'PGRST116') return null; // not found
    throw new Error(noteRes.error.message);
  }

  const linksRes = await supabase
    .from('note_characters')
    .select('character_id')
    .eq('note_id', id);
  if (linksRes.error) throw new Error(linksRes.error.message);

  const characterIds = (linksRes.data || []).map((link) => link.character_id);
  let characters = [];
  if (characterIds.length > 0) {
    const charactersRes = await supabase
      .from('characters')
      .select('*')
      .in('id', characterIds);
    if (charactersRes.error) throw new Error(charactersRes.error.message);
    characters = (charactersRes.data || []).map((row) => mapCharacter(row));
  }

  return mapNote(noteRes.data, characters);
}

export async function createNote({ title, date, content, imageUrl = null, characterIds = [] }) {
  const supabase = getSupabaseServerClient();
  const clean = {
    title: sanitizeHtml(title || ''),
    date,
    content: sanitizeContent(content),
    image_url: imageUrl
  };

  const insertRes = await supabase.from('notes').insert(clean).select().single();
  if (insertRes.error) throw new Error(insertRes.error.message);

  if (characterIds.length > 0) {
    await setNoteCharacters(insertRes.data.id, characterIds);
  }

  return fetchNoteById(insertRes.data.id);
}

export async function updateNote(id, { title, date, content, imageUrl, characterIds }) {
  const supabase = getSupabaseServerClient();
  const patch = {};
  if (title !== undefined) patch.title = sanitizeHtml(title);
  if (date !== undefined) patch.date = date;
  if (content !== undefined) patch.content = sanitizeContent(content);
  if (imageUrl !== undefined) patch.image_url = imageUrl;

  if (Object.keys(patch).length > 0) {
    const updateRes = await supabase.from('notes').update(patch).eq('id', id);
    if (updateRes.error) throw new Error(updateRes.error.message);
  }

  if (Array.isArray(characterIds)) {
    await setNoteCharacters(id, characterIds);
  }

  return fetchNoteById(id);
}

export async function deleteNote(id) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setNoteCharacters(noteId, characterIds) {
  const supabase = getSupabaseServerClient();
  const existingRes = await supabase
    .from('note_characters')
    .select('character_id')
    .eq('note_id', noteId);
  if (existingRes.error) throw new Error(existingRes.error.message);

  const existingIds = new Set((existingRes.data || []).map((row) => row.character_id));
  const desiredIds = new Set(characterIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)));

  const toAdd = [...desiredIds].filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !desiredIds.has(id));

  if (toAdd.length > 0) {
    const insertRes = await supabase
      .from('note_characters')
      .insert(toAdd.map((characterId) => ({ note_id: noteId, character_id: characterId })));
    if (insertRes.error) throw new Error(insertRes.error.message);
  }

  if (toRemove.length > 0) {
    const deleteRes = await supabase
      .from('note_characters')
      .delete()
      .eq('note_id', noteId)
      .in('character_id', toRemove);
    if (deleteRes.error) throw new Error(deleteRes.error.message);
  }
}

export async function addCharacterToNote(noteId, characterId) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('note_characters')
    .insert({ note_id: noteId, character_id: characterId });
  if (error && error.code !== '23505') { // ignore duplicates
    throw new Error(error.message);
  }
}

export async function removeCharacterFromNote(noteId, characterId) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('note_characters')
    .delete()
    .match({ note_id: noteId, character_id: characterId });
  if (error) throw new Error(error.message);
}
