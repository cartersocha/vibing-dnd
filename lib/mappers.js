function toCharacterDto(row) {
  return {
    id: row.id,
    name: row.name,
    race: row.race,
    class: row.class,
    status: row.status,
    location: row.location,
    backstory: row.backstory,
    imageUrl: row.image_url,
    playerType: row.player_type,
  };
}

function toNoteDto(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    content: row.content,
    imageUrl: row.image_url,
  };
}

export function mergeNotesWithCharacters(notes, noteLinks, characters) {
  const characterMap = new Map(characters.map((c) => [c.id, toCharacterDto(c)]));
  const noteCharacterMap = new Map();
  for (const link of noteLinks) {
    if (!noteCharacterMap.has(link.note_id)) {
      noteCharacterMap.set(link.note_id, []);
    }
    const char = characterMap.get(link.character_id);
    if (char) {
      noteCharacterMap.get(link.note_id).push(char);
    }
  }

  return notes.map((note) => ({
    ...toNoteDto(note),
    characters: noteCharacterMap.get(note.id) || [],
  }));
}

export function mergeCharactersWithNotes(characters, links, notes) {
  const noteMap = new Map(notes.map((n) => [n.id, toNoteDto(n)]));
  const charNoteMap = new Map();
  for (const link of links) {
    if (!charNoteMap.has(link.character_id)) {
      charNoteMap.set(link.character_id, []);
    }
    const note = noteMap.get(link.note_id);
    if (note) {
      charNoteMap.get(link.character_id).push(note);
    }
  }

  return characters.map((character) => ({
    ...toCharacterDto(character),
    sessions: (charNoteMap.get(character.id) || []).sort((a, b) => new Date(a.date) - new Date(b.date)),
  }));
}

export function toNoteDtoSingle(row, characters = []) {
  return {
    ...toNoteDto(row),
    characters: characters.map(toCharacterDto),
  };
}

export function toCharacterDtoSingle(row, sessions = []) {
  return {
    ...toCharacterDto(row),
    sessions: sessions.map(toNoteDto),
  };
}
