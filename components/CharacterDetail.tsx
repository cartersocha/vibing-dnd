'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CharacterEditor from '@/components/CharacterEditor';
import type { Character, Note } from '@/lib/types';
import {
  deleteCharacterAction,
  updateCharacterAction
} from '@/components/actions';

export default function CharacterDetail({
  character,
  notes
}: {
  character: Character;
  notes: Note[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const deleteAction = deleteCharacterAction.bind(null, character.id);
  const updateAction = updateCharacterAction.bind(null, character.id);
  const router = useRouter();

  if (isEditing) {
    return (
      <CharacterEditor
        title={`Edit ${character.name}`}
        character={character}
        notes={notes}
        action={updateAction}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => {
          router.refresh();
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{character.name}</h2>
          {character.status && <p className="text-muted">Status: {character.status}</p>}
        </div>
        <div className="action-group">
          <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <form
            action={deleteAction}
            style={{ marginLeft: '1rem' }}
            onSubmit={event => {
              if (!window.confirm('Delete this character permanently?')) {
                event.preventDefault();
              }
            }}
          >
            <button type="submit" className="btn btn-danger">
              Delete
            </button>
          </form>
        </div>
      </div>
      {character.imageUrl && (
        <div className="banner-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={character.imageUrl} alt={character.name} className="character-portrait-large" />
        </div>
      )}
      <div className="card">
        <dl className="character-details">
          <div>
            <dt>Race</dt>
            <dd>{character.race ?? 'Unknown'}</dd>
          </div>
          <div>
            <dt>Class</dt>
            <dd>{character.class ?? 'Unknown'}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{character.location ?? 'Unknown'}</dd>
          </div>
          <div>
            <dt>Player Type</dt>
            <dd>{character.playerType === 'pc' ? 'Player Character' : 'Non-player Character'}</dd>
          </div>
        </dl>
        {character.backstory && (
          <section className="character-backstory">
            <h3>Backstory</h3>
            <p>{character.backstory}</p>
          </section>
        )}
        <section className="related-section">
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h3>Sessions Appeared</h3>
            <Link href="/sessions" className="btn btn-secondary">
              View sessions
            </Link>
          </div>
          {character.sessions.length === 0 ? (
            <p className="no-items-text">This character has not been linked to any sessions yet.</p>
          ) : (
            <div className="related-items-list">
              {character.sessions.map(session => (
                <Link key={session.id} href={`/notes/${session.id}`} className="related-item-pill">
                  {session.title} ({new Date(session.date).toLocaleDateString()})
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
