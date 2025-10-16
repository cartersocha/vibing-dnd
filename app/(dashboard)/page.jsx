import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import { fetchNotesWithRelations } from '@/lib/data/notes';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const notes = await fetchNotesWithRelations();
  const numberedNotes = notes.sort((a, b) => Number(b.id) - Number(a.id));
  const recentNotes = numberedNotes.slice(0, 3);

  return (
    <div className="container">
      <section className="card">
        <div className="page-header">
          <h2>Recent Sessions</h2>
          <Link href="/sessions" className="btn btn-secondary">
            View All Sessions
          </Link>
        </div>
        <div className="note-grid">
          {recentNotes.length === 0 && <p>No session notes yet. Time to start the adventure!</p>}
          {recentNotes.map((note) => (
            <article key={note.id} className="card">
              <div className="page-header">
                <h3>
                  Session {note.sessionNumber}: {note.title}
                </h3>
                {note.date && (
                  <span className="session-date">
                    {new Date(note.date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="markdown-content">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {note.content?.slice(0, 300) || ''}
                </ReactMarkdown>
              </div>
              <div className="card-footer">
                <Link href={`/sessions/${note.id}`} className="btn btn-primary">
                  View Session
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
