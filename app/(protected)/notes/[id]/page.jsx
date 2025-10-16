import NoteDetailPage from '@/app/components/NoteDetailPage';
import { requireAuth } from '@/lib/auth';
import { fetchCharactersWithSessions, fetchNoteById, fetchNotesWithCharacters } from '@/lib/data';

export default async function NoteDetail({ params }) {
  requireAuth();
  const noteId = Number(params.id);
  const [notes, note, characters] = await Promise.all([
    fetchNotesWithCharacters(),
    fetchNoteById(noteId),
    fetchCharactersWithSessions(),
  ]);

  const sortedByDate = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date));
  const sessionNumberMap = new Map(sortedByDate.map((item, index) => [item.id, index + 1]));
  const noteWithSessionNumber = { ...note, sessionNumber: sessionNumberMap.get(note.id) || 1 };

  return <NoteDetailPage initialNote={noteWithSessionNumber} characters={characters} />;
}
