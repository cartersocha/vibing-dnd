'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import NoteForm from './NoteForm';
import {
  updateNoteAction,
  deleteNoteAction,
  addCharacterToNoteAction,
  removeCharacterFromNoteAction
} from '@/app/actions/notes';

export default function NoteDetail({ note, allCharacters = [] }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const availableCharacters = useMemo(() => {
    return allCharacters.filter(
      (char) => !note.characters?.some((existing) => existing.id === char.id)
    );
  }, [allCharacters, note.characters]);

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    startTransition(async () => {
      const result = await deleteNoteAction(note.id);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/sessions');
      }
    });
  };

  const handleAddCharacter = (characterId) => {
    const id = Number(characterId);
    if (Number.isNaN(id)) return;
    startTransition(async () => {
      const result = await addCharacterToNoteAction(note.id, id);
      if (result?.error) {
        setError(result.error);
      } else {
        setError('');
        router.refresh();
      }
    });
  };

  const handleRemoveCharacter = (characterId) => {
    startTransition(async () => {
      const result = await removeCharacterFromNoteAction(note.id, characterId);
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
      <NoteForm
        note={note}
        characters={allCharacters}
        action={updateNoteAction}
        onSuccess={() => {
          setIsEditing(false);
          router.refresh();
        }}
        submitLabel="Update Session"
      />
    );
  }

  return (
    <div className="note-detail-page">
      <div className="card">
        {error && <p className="error-text">{error}</p>}
        {note.imageUrl && (
          <img src={note.imageUrl} alt={note.title} className="session-banner-image" />
        )}
        <div className="page-header">
          <div>
            <h2>
              Session {note.sessionNumber}: {note.title}
            </h2>
            {note.date && (
              <p className="session-date-header">
                {new Date(note.date).toLocaleDateString()}
              </p>
            )}
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
        <div className="markdown-content">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{note.content}</ReactMarkdown>
        </div>
        <hr style={{ margin: '2rem 0' }} />
        <div className="card-header">
          <h3>Characters in this Session</h3>
          {availableCharacters.length > 0 && (
            <div className="add-character-to-session">
              <select
                className="btn btn-secondary"
                value=""
                onChange={(event) => {
                  handleAddCharacter(event.target.value);
                  event.target.value = '';
                }}
              >
                <option value="" disabled>
                  + Add Character
                </option>
                {availableCharacters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {note.characters && note.characters.length > 0 ? (
          <div className="related-items-list">
            {note.characters.map((char) => (
              <span key={char.id} className="related-item-pill editable">
                <Link href={`/characters/${char.id}`}>{char.name}</Link>
                <button
                  className="pill-close"
                  type="button"
                  onClick={() => handleRemoveCharacter(char.id)}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="no-items-text">No characters have been added to this session yet.</p>
        )}
      </div>
    </div>
  );
}
