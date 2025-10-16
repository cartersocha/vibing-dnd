import Link from 'next/link';
import type { Character, Note } from '@/lib/types';

export default function CharactersPage({
  characters,
  notes
}: {
  characters: Character[];
  notes: Note[];
}) {
  return (
    <div className="page">
      <div className="page-header">
        <h2>Characters</h2>
        <Link href="/characters/new" className="btn btn-primary">
          + New Character
        </Link>
      </div>
      {characters.length === 0 ? (
        <p className="no-items-text">No characters recorded yet.</p>
      ) : (
        <div className="list-grid">
          {characters.map(character => (
            <article key={character.id} className="card">
              <header className="card-header">
                <div>
                  <h3>{character.name}</h3>
                  {character.status && <p className="text-muted">Status: {character.status}</p>}
                </div>
                <Link href={`/characters/${character.id}`} className="btn btn-secondary">
                  Open
                </Link>
              </header>
              <p className="text-muted">
                {character.sessions.length} session{character.sessions.length === 1 ? '' : 's'} seen
              </p>
            </article>
          ))}
        </div>
      )}
      {notes.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>Need a refresher?</h3>
          <p className="text-muted">
            Browse the <Link href="/sessions">session archive</Link> to see how these characters are connected.
          </p>
        </div>
      )}
    </div>
  );
}
