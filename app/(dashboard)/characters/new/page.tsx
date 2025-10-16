import CharacterEditor from '@/components/CharacterEditor';
import { createCharacterAction } from '@/components/actions';
import { getNotes } from '@/lib/data';

export default async function NewCharacterPage() {
  const notes = await getNotes();
  return (
    <CharacterEditor
      title="Create Character"
      notes={notes}
      action={createCharacterAction}
    />
  );
}
