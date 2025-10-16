import HomePage from '@/components/HomePage';
import { getNotes } from '@/lib/data';

export default async function Page() {
  const notes = await getNotes();
  return <HomePage notes={notes} />;
}
