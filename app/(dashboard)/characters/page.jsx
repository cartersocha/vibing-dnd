import { fetchCharactersWithRelations } from '@/lib/data/characters';
import CharactersList from '@/components/CharactersList';

export const dynamic = 'force-dynamic';

export default async function CharactersPage() {
  const characters = await fetchCharactersWithRelations();
  return <CharactersList characters={characters} />;
}
