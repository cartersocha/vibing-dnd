import { getSupabaseClient } from './supabase';
import { mergeCharactersWithNotes, mergeNotesWithCharacters, toCharacterDtoSingle, toNoteDtoSingle } from './mappers';

export async function fetchNotesWithCharacters() {
  const supabase = getSupabaseClient();
  const [{ data: notes, error: notesError }, { data: characters, error: charactersError }, { data: links, error: linksError }] = await Promise.all([
    supabase.from('notes').select('*').order('id', { ascending: false }),
    supabase.from('characters').select('*'),
    supabase.from('note_characters').select('note_id, character_id'),
  ]);

  if (notesError || charactersError || linksError) {
    throw new Error(notesError?.message || charactersError?.message || linksError?.message || 'Failed to load notes');
  }

  return mergeNotesWithCharacters(notes || [], links || [], characters || []);
}

export async function fetchCharactersWithSessions() {
  const supabase = getSupabaseClient();
  const [{ data: characters, error: charactersError }, { data: notes, error: notesError }, { data: links, error: linksError }] = await Promise.all([
    supabase.from('characters').select('*').order('name'),
    supabase.from('notes').select('*'),
    supabase.from('note_characters').select('note_id, character_id'),
  ]);

  if (charactersError || notesError || linksError) {
    throw new Error(charactersError?.message || notesError?.message || linksError?.message || 'Failed to load characters');
  }

  return mergeCharactersWithNotes(characters || [], links || [], notes || []);
}

export async function fetchNoteById(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
  if (error) {
    throw new Error(error.message);
  }

  const { data: joinedLinks } = await supabase
    .from('note_characters')
    .select('character_id, characters(*)')
    .eq('note_id', id);
  const characters = (joinedLinks || []).map((row) => row.characters).filter(Boolean);

  return toNoteDtoSingle(data, characters);
}

export async function fetchCharacterById(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('characters').select('*').eq('id', id).single();
  if (error) {
    throw new Error(error.message);
  }

  const { data: joinedLinks } = await supabase
    .from('note_characters')
    .select('note_id, notes(*)')
    .eq('character_id', id);
  const sessions = (joinedLinks || []).map((row) => row.notes).filter(Boolean);

  return toCharacterDtoSingle(data, sessions);
}
