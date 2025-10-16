export function mapCharacter(row, sessions = []) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    race: row.race,
    class: row.class,
    status: row.status,
    location: row.location,
    backstory: row.backstory,
    imageUrl: row.image_url || null,
    playerType: row.player_type || null,
    sessions
  };
}

export function mapNote(row, characters = []) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    content: row.content,
    imageUrl: row.image_url || null,
    characters
  };
}

export function applySessionNumbers(notes) {
  if (!Array.isArray(notes)) return [];
  const sortedByDate = [...notes].sort((a, b) => new Date(a.date || '') - new Date(b.date || ''));
  const sessionNumberMap = new Map(sortedByDate.map((note, index) => [note.id, index + 1]));
  return notes.map((note) => ({
    ...note,
    sessionNumber: sessionNumberMap.get(note.id) || 1
  }));
}
