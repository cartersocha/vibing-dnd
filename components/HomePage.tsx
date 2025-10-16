import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type { Note } from '@/lib/types';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function HomePage({ notes }: { notes: Note[] }) {
  const recentNotes = notes.slice(0, 3);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Recent Sessions</h2>
        <Link href="/sessions/new" className="btn btn-primary">
          + New Session
        </Link>
      </div>
      {recentNotes.length === 0 ? (
        <p className="no-items-text">No sessions have been logged yet.</p>
      ) : (
        recentNotes.map(note => (
          <article className="card" key={note.id}>
            <header className="card-header">
              <div>
                <h3>
                  <Link href={`/notes/${note.id}`}>
                    Session {note.sessionNumber ?? '?'} &middot; {note.title}
                  </Link>
                </h3>
                <p className="text-muted">{formatDate(note.date)}</p>
              </div>
              <Link href={`/notes/${note.id}`} className="btn btn-secondary">
                View
              </Link>
            </header>
            <div className="markdown-content">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {note.content.slice(0, 500)}{note.content.length > 500 ? '…' : ''}
              </ReactMarkdown>
            </div>
            {note.characters.length > 0 && (
              <div className="related-items-list">
                {note.characters.map(character => (
                  <Link key={character.id} href={`/characters/${character.id}`} className="related-item-pill">
                    {character.name}
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))
      )}
    </div>
  );
}
