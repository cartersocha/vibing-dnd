import HomePage from '@/app/components/HomePage';
import { requireAuth } from '@/lib/auth';
import { fetchNotesWithCharacters } from '@/lib/data';

export default async function ProtectedHomePage() {
  requireAuth();
  const notes = await fetchNotesWithCharacters();
  const sortedByDate = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date));
  const sessionNumberMap = new Map(sortedByDate.map((note, index) => [note.id, index + 1]));
  const numberedNotes = notes.map((note) => ({ ...note, sessionNumber: sessionNumberMap.get(note.id) || 1 }));
  const recentNotes = numberedNotes.slice(0, 3);

  return <HomePage recentNotes={recentNotes} />;
}
