import CharacterDetailPage from '@/app/components/CharacterDetailPage';
import { requireAuth } from '@/lib/auth';
import { fetchCharacterById, fetchNotesWithCharacters } from '@/lib/data';

export default async function CharacterDetail({ params }) {
  requireAuth();
  const characterId = Number(params.id);
  const [character, notes] = await Promise.all([
    fetchCharacterById(characterId),
    fetchNotesWithCharacters(),
  ]);

  return <CharacterDetailPage initialCharacter={character} notes={notes} />;
}
