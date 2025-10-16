'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CharacterForm from './CharacterForm';
import { updateCharacterAction, deleteCharacterAction } from '@/app/actions/characters';
import { addCharacterToNoteAction, removeCharacterFromNoteAction } from '@/app/actions/notes';

export default function CharacterDetail({ character, sessions = [] }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const availableSessions = useMemo(() => {
    return sessions.filter(
      (session) => !character.sessions?.some((entry) => entry.id === session.id)
    );
  }, [character.sessions, sessions]);

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to permanently delete this character?')) return;
    startTransition(async () => {
      const result = await deleteCharacterAction(character.id);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/characters');
      }
    });
  };

  const handleLinkSession = (sessionId) => {
    const id = Number(sessionId);
    if (Number.isNaN(id)) return;
    startTransition(async () => {
      const result = await addCharacterToNoteAction(id, character.id);
      if (result?.error) {
        setError(result.error);
      } else {
        setError('');
        router.refresh();
      }
    });
  };

  const handleUnlinkSession = (sessionId) => {
    startTransition(async () => {
      const result = await removeCharacterFromNoteAction(sessionId, character.id);
      if (result?.error) {
        setError(result.error);
      } else {
        setError('');
        router.refresh();
      }
    });
  };

  if (isEditing) {
    return (
      <CharacterForm
        character={character}
        sessions={sessions}
        action={updateCharacterAction}
        onSuccess={() => {
          setIsEditing(false);
          router.refresh();
        }}
        submitLabel="Update Character"
      />
    );
  }

  return (
    <div className="card character-detail-card">
      {error && <p className="error-text">{error}</p>}
      <div className="character-detail-header">
        <div>
          <h2>{character.name}</h2>
          <p className="character-subtitle">
            {character.race} {character.class} • {character.playerType || 'Unknown'}
          </p>
          <p className="character-status">Status: {character.status || 'Unknown'}</p>
          {character.location && <p className="character-location">Last seen in {character.location}</p>}
        </div>
        <div className="header-actions-group">
          <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={isPending}>
            Delete
          </button>
        </div>
      </div>
      <div className="character-detail-body">
        <div className="character-detail-main">
          <section>
            <h3>Backstory</h3>
            <p className="markdown-content">{character.backstory || 'No backstory recorded yet.'}</p>
          </section>
          <section>
            <div className="card-header">
              <h3>Sessions</h3>
              {availableSessions.length > 0 && (
                <div className="add-character-to-session">
                  <select
                    className="btn btn-secondary"
                    value=""
                    onChange={(event) => {
                      handleLinkSession(event.target.value);
                      event.target.value = '';
                    }}
                  >
                    <option value="" disabled>
                      + Link Session
                    </option>
                    {availableSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        Session {session.sessionNumber}: {session.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {character.sessions?.length ? (
              <div className="related-items-list">
                {character.sessions.map((session) => (
                  <span key={session.id} className="related-item-pill editable">
                    <Link href={`/sessions/${session.id}`}>{session.title}</Link>
                    <button
                      type="button"
                      className="pill-close"
                      onClick={() => handleUnlinkSession(session.id)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="no-items-text">This character has not appeared in any sessions yet.</p>
            )}
          </section>
        </div>
        {character.imageUrl && (
          <aside className="character-detail-sidebar">
            <img src={character.imageUrl} alt={character.name} className="character-portrait-large" />
          </aside>
        )}
      </div>
    </div>
  );
}
