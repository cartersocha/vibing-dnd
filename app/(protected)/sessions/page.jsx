import AllSessionsPage from '@/app/components/AllSessionsPage';
import { requireAuth } from '@/lib/auth';
import { fetchNotesWithCharacters } from '@/lib/data';

export default async function SessionsPage() {
  requireAuth();
  const notes = await fetchNotesWithCharacters();
  const sortedByDate = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date));
  const sessionNumberMap = new Map(sortedByDate.map((note, index) => [note.id, index + 1]));
  const numberedNotes = notes.map((note) => ({ ...note, sessionNumber: sessionNumberMap.get(note.id) || 1 }));

  return <AllSessionsPage notes={numberedNotes} />;
}
