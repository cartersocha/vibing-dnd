'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AllSessionsPage({ notes }) {
  const [sortOrder, setSortOrder] = useState('desc');
  const router = useRouter();

  const sortedNotes = useMemo(() => {
    const sortableNotes = [...notes];
    sortableNotes.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.id - b.id;
      }
      return b.id - a.id;
    });
    return sortableNotes;
  }, [notes, sortOrder]);

  return (
    <section className="all-sessions-page">
      <div className="page-header">
        <h2>Full Campaign Log</h2>
        <div className="header-actions-group">
          <button onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))} className="btn btn-secondary">
            Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/sessions/new')}>
            + Add Session
          </button>
        </div>
      </div>
      {sortedNotes.map((note) => (
        <article key={note.id} className="card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/notes/${note.id}`)}>
          <div className="card-header">
            <h3>Session {note.sessionNumber}: {note.title}</h3>
            {note.date && <span className="session-date">{new Date(note.date).toLocaleDateString()}</span>}
          </div>
          <p>{note.content.substring(0, 140)}...</p>
          {note.characters && note.characters.length > 0 && (
            <div className="related-items-list">
              {note.characters.map((char) => (
                <button
                  key={char.id}
                  className="related-item-pill"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/characters/${char.id}`);
                  }}
                >
                  {char.name}
                </button>
              ))}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
