import CharacterDetail from '@/components/CharacterDetail';
import { getCharacterById, getNotes } from '@/lib/data';
import { notFound } from 'next/navigation';

export default async function CharacterDetailPage({
  params
}: {
  params: { id: string };
}) {
  const character = await getCharacterById(Number(params.id));
  if (!character) {
    notFound();
  }
  const notes = await getNotes();
  return <CharacterDetail character={character} notes={notes} />;
}
