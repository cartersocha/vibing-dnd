import CharactersPage from '@/app/components/CharactersPage';
import { requireAuth } from '@/lib/auth';
import { fetchCharactersWithSessions, fetchNotesWithCharacters } from '@/lib/data';

export default async function CharactersListPage() {
  requireAuth();
  const [characters, notes] = await Promise.all([
    fetchCharactersWithSessions(),
    fetchNotesWithCharacters(),
  ]);

  const sortedByDate = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date));
  const sessionNumberMap = new Map(sortedByDate.map((note, index) => [note.id, index + 1]));
  const numberedNotes = notes.map((note) => ({ ...note, sessionNumber: sessionNumberMap.get(note.id) || 1 }));

  return <CharactersPage characters={characters} notes={numberedNotes} />;
}
