'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function SessionsList({ notes }) {
  const [sortOrder, setSortOrder] = useState('desc');

  const sortedNotes = useMemo(() => {
    const copy = [...(notes || [])];
    copy.sort((a, b) => {
      if (sortOrder === 'asc') {
        return Number(a.id) - Number(b.id);
      }
      return Number(b.id) - Number(a.id);
    });
    return copy;
  }, [notes, sortOrder]);

  return (
    <section className="all-sessions-page">
      <div className="page-header">
        <h2>Full Campaign Log</h2>
        <div className="header-actions-group">
          <button className="btn btn-secondary" onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}>
            Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
          <Link href="/sessions/new" className="btn btn-primary">
            + Add Session
          </Link>
        </div>
      </div>
      <div className="note-list-full">
        {sortedNotes.map((note) => (
          <Link key={note.id} href={`/sessions/${note.id}`} className="note-link">
            <div className="card">
              <div className="page-header">
                <h3>
                  Session {note.sessionNumber}: {note.title}
                </h3>
                {note.date && <span className="session-date">{new Date(note.date).toLocaleDateString()}</span>}
              </div>
              <div className="markdown-content">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {(note.content || '').slice(0, 200)}...
                </ReactMarkdown>
              </div>
              {note.characters?.length > 0 && (
                <div className="session-characters">
                  <div className="related-items-list">
                    {note.characters.map((char) => (
                      <span key={char.id} className="related-item-pill">
                        {char.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
