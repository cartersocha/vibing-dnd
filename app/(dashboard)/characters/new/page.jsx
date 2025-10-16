import { fetchNotesWithRelations } from '@/lib/data/notes';
import CharacterForm from '@/components/CharacterForm';
import { createCharacterAction } from '@/app/actions/characters';

export const dynamic = 'force-dynamic';

export default async function NewCharacterPage() {
  const sessions = await fetchNotesWithRelations();
  return (
    <CharacterForm
      character={{}}
      sessions={sessions}
      action={createCharacterAction}
      redirectTo="/characters/:id"
      submitLabel="Create Character"
    />
  );
}
