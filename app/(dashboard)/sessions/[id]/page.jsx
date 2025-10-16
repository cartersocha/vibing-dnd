import { notFound } from 'next/navigation';
import { fetchNotesWithRelations, fetchNoteById } from '@/lib/data/notes';
import { fetchCharactersWithRelations } from '@/lib/data/characters';
import NoteDetail from '@/components/NoteDetail';

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({ params }) {
  const noteId = Number(params.id);
  const [notes, characters] = await Promise.all([
    fetchNotesWithRelations(),
    fetchCharactersWithRelations()
  ]);

  const note = notes.find((entry) => entry.id === noteId) || (await fetchNoteById(noteId));

  if (!note) {
    notFound();
  }

  return <NoteDetail note={note} allCharacters={characters} />;
}
