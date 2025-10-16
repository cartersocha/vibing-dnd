import NoteDetail from '@/components/NoteDetail';
import { getCharacters, getNoteById, getNotes } from '@/lib/data';
import { notFound } from 'next/navigation';

export default async function NoteDetailPage({
  params
}: {
  params: { id: string };
}) {
  const noteId = Number(params.id);
  const [note, allNotes] = await Promise.all([
    getNoteById(noteId),
    getNotes()
  ]);
  if (!note) {
    notFound();
  }
  const fullNote = allNotes.find(entry => entry.id === note.id);
  const characters = await getCharacters();
  return <NoteDetail note={{ ...note, sessionNumber: fullNote?.sessionNumber }} allCharacters={characters} />;
}
