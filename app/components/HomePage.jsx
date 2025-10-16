'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage({ recentNotes }) {
  const router = useRouter();

  return (
    <section>
      <div className="page-header">
        <h2>Recent Dispatches</h2>
        <Link href="/sessions/new" className="btn btn-primary">+ Add Session</Link>
      </div>
      {recentNotes.length ? (
        recentNotes.map((note) => (
          <div
            key={note.id}
            className="note-link"
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/notes/${note.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push(`/notes/${note.id}`);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="card">
              <div className="card-header">
                <h3>Session {note.sessionNumber}: {note.title}</h3>
                {note.date && (
                  <span className="session-date">{new Date(note.date).toLocaleDateString()}</span>
                )}
              </div>
              <p>{note.content.substring(0, 100)}...</p>
              {note.characters && note.characters.length > 0 && (
                <div className="session-characters">
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
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <p>No session notes yet. Time to start the adventure!</p>
      )}
    </section>
  );
}
