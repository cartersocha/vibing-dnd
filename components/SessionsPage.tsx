import Link from 'next/link';
import type { Note } from '@/lib/types';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default function SessionsPage({ notes }: { notes: Note[] }) {
  return (
    <div className="page">
      <div className="page-header">
        <h2>All Sessions</h2>
        <Link href="/sessions/new" className="btn btn-primary">
          + New Session
        </Link>
      </div>
      {notes.length === 0 ? (
        <p className="no-items-text">No sessions recorded yet.</p>
      ) : (
        <div className="list-grid">
          {notes.map(note => (
            <article key={note.id} className="card">
              <header className="card-header">
                <div>
                  <h3>Session {note.sessionNumber ?? '?'} &middot; {note.title}</h3>
                  <p className="text-muted">{formatDate(note.date)}</p>
                </div>
                <Link href={`/notes/${note.id}`} className="btn btn-secondary">
                  Open
                </Link>
              </header>
              <p className="text-muted">
                {note.characters.length} character{note.characters.length === 1 ? '' : 's'} involved
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
