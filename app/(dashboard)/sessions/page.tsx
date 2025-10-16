import SessionsPage from '@/components/SessionsPage';
import { getNotes } from '@/lib/data';

export default async function SessionsRoute() {
  const notes = await getNotes();
  return <SessionsPage notes={notes} />;
}
