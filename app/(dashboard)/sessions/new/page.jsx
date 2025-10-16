import { fetchCharactersWithRelations } from '@/lib/data/characters';
import NoteForm from '@/components/NoteForm';
import { createNoteAction } from '@/app/actions/notes';

export const dynamic = 'force-dynamic';

export default async function NewSessionPage() {
  const characters = await fetchCharactersWithRelations();
  return (
    <NoteForm
      note={{}}
      characters={characters}
      action={createNoteAction}
      redirectTo="/sessions"
      submitLabel="Create Session"
    />
  );
}
