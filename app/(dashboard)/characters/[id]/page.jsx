import { notFound } from 'next/navigation';
import { fetchCharactersWithRelations, fetchCharacterById } from '@/lib/data/characters';
import { fetchNotesWithRelations } from '@/lib/data/notes';
import CharacterDetail from '@/components/CharacterDetail';

export const dynamic = 'force-dynamic';

export default async function CharacterDetailPage({ params }) {
  const characterId = Number(params.id);
  const [characters, sessions] = await Promise.all([
    fetchCharactersWithRelations(),
    fetchNotesWithRelations()
  ]);

  const character = characters.find((entry) => entry.id === characterId) || (await fetchCharacterById(characterId));

  if (!character) {
    notFound();
  }

  return <CharacterDetail character={character} sessions={sessions} />;
}
