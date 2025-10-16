import CharactersPage from '@/components/CharactersPage';
import { getCharacters, getNotes } from '@/lib/data';

export default async function CharactersRoute() {
  const [characters, notes] = await Promise.all([getCharacters(), getNotes()]);
  return <CharactersPage characters={characters} notes={notes} />;
}
