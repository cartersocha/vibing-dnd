import CreateNote from '@/app/components/CreateNote';
import { requireAuth } from '@/lib/auth';
import { fetchCharactersWithSessions } from '@/lib/data';

export default async function NewSessionPage() {
  requireAuth();
  const characters = await fetchCharactersWithSessions();
  return <CreateNote characters={characters} />;
}
