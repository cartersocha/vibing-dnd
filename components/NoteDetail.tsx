'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import NoteEditor from '@/components/NoteEditor';
import type { Character, Note } from '@/lib/types';
import {
  deleteNoteAction,
  updateNoteAction
} from '@/components/actions';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default function NoteDetail({
  note,
  allCharacters
}: {
  note: Note;
  allCharacters: Character[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const deleteAction = deleteNoteAction.bind(null, note.id);
  const updateAction = updateNoteAction.bind(null, note.id);
  const router = useRouter();

  if (isEditing) {
    return (
      <NoteEditor
        title={`Edit Session ${note.sessionNumber ?? ''}`}
        note={note}
        characters={allCharacters}
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
          <h2>
            Session {note.sessionNumber ?? '?'} &middot; {note.title}
          </h2>
          <p className="text-muted">{formatDate(note.date)}</p>
        </div>
        <div className="action-group">
          <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <form
            action={deleteAction}
            style={{ marginLeft: '1rem' }}
            onSubmit={event => {
              if (!window.confirm('Delete this session permanently?')) {
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
      {note.imageUrl && (
        <div className="banner-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={note.imageUrl} alt={note.title} className="session-banner-image" />
        </div>
      )}
      <div className="card">
        <div className="markdown-content">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{note.content}</ReactMarkdown>
        </div>
        <section className="related-section">
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h3>Characters Present</h3>
            <Link href="/characters" className="btn btn-secondary">
              View all characters
            </Link>
          </div>
          {note.characters.length === 0 ? (
            <p className="no-items-text">No characters have been linked to this session yet.</p>
          ) : (
            <div className="related-items-list">
              {note.characters.map(character => (
                <Link key={character.id} href={`/characters/${character.id}`} className="related-item-pill">
                  {character.name}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
