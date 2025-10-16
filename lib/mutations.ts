import sanitizeHtml from 'sanitize-html';
import { createServiceClient } from '@/lib/supabase/server';

function cleanRichText(content: string) {
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title']
    }
  });
}

export interface NoteInput {
  title: string;
  date: string;
  content: string;
  imageUrl?: string | null;
  characterIds?: number[];
}

export interface CharacterInput {
  name: string;
  race?: string | null;
  class?: string | null;
  status?: string | null;
  location?: string | null;
  backstory?: string | null;
  playerType?: string | null;
  imageUrl?: string | null;
  sessionIds?: number[];
}

export async function insertNote(input: NoteInput) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      title: sanitizeHtml(input.title),
      date: input.date,
      content: cleanRichText(input.content),
      image_url: input.imageUrl ?? null
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (input.characterIds && input.characterIds.length > 0) {
    await syncNoteCharacters(data.id, input.characterIds);
  }

  return data;
}

export async function updateNote(noteId: number, input: NoteInput) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('notes')
    .update({
      title: sanitizeHtml(input.title),
      date: input.date,
      content: cleanRichText(input.content),
      image_url: input.imageUrl ?? null
    })
    .eq('id', noteId);

  if (error) throw new Error(error.message);

  if (input.characterIds) {
    await syncNoteCharacters(noteId, input.characterIds);
  }
}

export async function deleteNote(noteId: number) {
  const supabase = createServiceClient();
  await supabase.from('note_characters').delete().eq('note_id', noteId);
  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  if (error) throw new Error(error.message);
}

export async function syncNoteCharacters(noteId: number, characterIds: number[]) {
  const supabase = createServiceClient();
  const { data: existing, error } = await supabase
    .from('note_characters')
    .select('character_id')
    .eq('note_id', noteId);

  if (error) throw new Error(error.message);

  const existingIds = new Set((existing ?? []).map(link => link.character_id));
  const desiredIds = new Set(characterIds);

  const toInsert = [...desiredIds].filter(id => !existingIds.has(id));
  const toDelete = [...existingIds].filter(id => !desiredIds.has(id));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('note_characters')
      .insert(toInsert.map(characterId => ({ note_id: noteId, character_id: characterId })));
    if (insertError) throw new Error(insertError.message);
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('note_characters')
      .delete()
      .eq('note_id', noteId)
      .in('character_id', toDelete);
    if (deleteError) throw new Error(deleteError.message);
  }
}

export async function addCharacterToNote(noteId: number, characterId: number) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('note_characters')
    .insert({ note_id: noteId, character_id: characterId });
  if (error) throw new Error(error.message);
}

export async function removeCharacterFromNote(noteId: number, characterId: number) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('note_characters')
    .delete()
    .match({ note_id: noteId, character_id: characterId });
  if (error) throw new Error(error.message);
}

export async function insertCharacter(input: CharacterInput) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('characters')
    .insert({
      name: sanitizeHtml(input.name),
      race: input.race ? sanitizeHtml(input.race) : null,
      class: input.class ? sanitizeHtml(input.class) : null,
      status: input.status ? sanitizeHtml(input.status) : null,
      location: input.location ? sanitizeHtml(input.location) : null,
      backstory: input.backstory ? sanitizeHtml(input.backstory) : null,
      player_type: input.playerType ? sanitizeHtml(input.playerType) : 'npc',
      image_url: input.imageUrl ?? null
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (input.sessionIds && input.sessionIds.length > 0) {
    await syncCharacterSessions(data.id, input.sessionIds);
  }

  return data;
}

export async function updateCharacter(characterId: number, input: CharacterInput) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('characters')
    .update({
      name: sanitizeHtml(input.name),
      race: input.race ? sanitizeHtml(input.race) : null,
      class: input.class ? sanitizeHtml(input.class) : null,
      status: input.status ? sanitizeHtml(input.status) : null,
      location: input.location ? sanitizeHtml(input.location) : null,
      backstory: input.backstory ? sanitizeHtml(input.backstory) : null,
      player_type: input.playerType ? sanitizeHtml(input.playerType) : 'npc',
      image_url: input.imageUrl ?? null
    })
    .eq('id', characterId);

  if (error) throw new Error(error.message);

  if (input.sessionIds) {
    await syncCharacterSessions(characterId, input.sessionIds);
  }
}

export async function deleteCharacter(characterId: number) {
  const supabase = createServiceClient();
  await supabase.from('note_characters').delete().eq('character_id', characterId);
  const { error } = await supabase.from('characters').delete().eq('id', characterId);
  if (error) throw new Error(error.message);
}

export async function syncCharacterSessions(characterId: number, sessionIds: number[]) {
  const supabase = createServiceClient();
  const { data: existing, error } = await supabase
    .from('note_characters')
    .select('note_id')
    .eq('character_id', characterId);

  if (error) throw new Error(error.message);

  const existingIds = new Set((existing ?? []).map(link => link.note_id));
  const desiredIds = new Set(sessionIds);

  const toInsert = [...desiredIds].filter(id => !existingIds.has(id));
  const toDelete = [...existingIds].filter(id => !desiredIds.has(id));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('note_characters')
      .insert(toInsert.map(noteId => ({ note_id: noteId, character_id: characterId })));
    if (insertError) throw new Error(insertError.message);
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('note_characters')
      .delete()
      .eq('character_id', characterId)
      .in('note_id', toDelete);
    if (deleteError) throw new Error(deleteError.message);
  }
}
