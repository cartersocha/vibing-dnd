import { cache } from 'react';
import { createServiceClient } from '@/lib/supabase/server';
import type { Character, CharacterSummary, Note, SessionSummary } from '@/lib/types';

function mapCharacterSummary(row: any): CharacterSummary | null {
  if (!row || !row.characters) return null;
  const character = row.characters;
  return {
    id: character.id,
    name: character.name,
    imageUrl: character.image_url ?? null,
    status: character.status ?? null,
    playerType: character.player_type ?? null
  };
}

function mapSessionSummary(row: any): SessionSummary | null {
  if (!row || !row.notes) return null;
  const note = row.notes;
  return {
    id: note.id,
    title: note.title,
    date: note.date
  };
}

function applySessionNumbers(notes: Note[]): Note[] {
  const sortedByDate = [...notes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sessionMap = new Map<number, number>();
  sortedByDate.forEach((note, idx) => {
    sessionMap.set(note.id, idx + 1);
  });
  return notes.map(note => ({
    ...note,
    sessionNumber: sessionMap.get(note.id)
  }));
}

export const getNotes = cache(async (): Promise<Note[]> => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('notes')
    .select(`
      id,
      title,
      date,
      content,
      image_url,
      note_characters:note_characters(
        characters:characters(
          id,
          name,
          image_url,
          status,
          player_type
        )
      )
    `)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(`Failed to load sessions: ${error.message}`);
  }

  const notes: Note[] = (data ?? []).map(row => ({
    id: row.id,
    title: row.title,
    date: row.date,
    content: row.content ?? '',
    imageUrl: row.image_url ?? null,
    characters: (row.note_characters ?? [])
      .map(mapCharacterSummary)
      .filter((value): value is CharacterSummary => Boolean(value))
  }));

  return applySessionNumbers(notes);
});

export const getNoteById = cache(async (id: number): Promise<Note | null> => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('notes')
    .select(`
      id,
      title,
      date,
      content,
      image_url,
      note_characters:note_characters(
        characters:characters(
          id,
          name,
          image_url,
          status,
          player_type
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to load session ${id}: ${error.message}`);
  }

  const note: Note = {
    id: data.id,
    title: data.title,
    date: data.date,
    content: data.content ?? '',
    imageUrl: data.image_url ?? null,
    characters: (data.note_characters ?? [])
      .map(mapCharacterSummary)
      .filter((value): value is CharacterSummary => Boolean(value))
  };

  return note;
});

export const getCharacters = cache(async (): Promise<Character[]> => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('characters')
    .select(`
      id,
      name,
      race,
      class,
      status,
      location,
      backstory,
      image_url,
      player_type,
      note_characters:note_characters(
        notes:notes(
          id,
          title,
          date
        )
      )
    `)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to load characters: ${error.message}`);
  }

  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    race: row.race ?? null,
    class: row.class ?? null,
    status: row.status ?? null,
    location: row.location ?? null,
    backstory: row.backstory ?? null,
    imageUrl: row.image_url ?? null,
    playerType: row.player_type ?? null,
    sessions: (row.note_characters ?? [])
      .map(mapSessionSummary)
      .filter((value): value is SessionSummary => Boolean(value))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }));
});

export const getCharacterById = cache(async (id: number): Promise<Character | null> => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('characters')
    .select(`
      id,
      name,
      race,
      class,
      status,
      location,
      backstory,
      image_url,
      player_type,
      note_characters:note_characters(
        notes:notes(
          id,
          title,
          date
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to load character ${id}: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    race: data.race ?? null,
    class: data.class ?? null,
    status: data.status ?? null,
    location: data.location ?? null,
    backstory: data.backstory ?? null,
    imageUrl: data.image_url ?? null,
    playerType: data.player_type ?? null,
    sessions: (data.note_characters ?? [])
      .map(mapSessionSummary)
      .filter((value): value is SessionSummary => Boolean(value))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  };
});
