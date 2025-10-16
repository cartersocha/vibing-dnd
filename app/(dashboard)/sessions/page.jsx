import { fetchNotesWithRelations } from '@/lib/data/notes';
import SessionsList from '@/components/SessionsList';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const notes = await fetchNotesWithRelations();
  return <SessionsList notes={notes} />;
}
