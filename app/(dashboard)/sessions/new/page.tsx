import NoteEditor from '@/components/NoteEditor';
import { createNoteAction } from '@/components/actions';
import { getCharacters } from '@/lib/data';

export default async function NewSessionPage() {
  const characters = await getCharacters();
  return (
    <NoteEditor
      title="Create Session"
      characters={characters}
      action={createNoteAction}
    />
  );
}
