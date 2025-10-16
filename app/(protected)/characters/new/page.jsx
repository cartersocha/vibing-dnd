import CreateCharacter from '@/app/components/CreateCharacter';
import { requireAuth } from '@/lib/auth';
import { fetchNotesWithCharacters } from '@/lib/data';

export default async function NewCharacterPage() {
  requireAuth();
  const notes = await fetchNotesWithCharacters();
  return <CreateCharacter notes={notes} />;
}
