import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5001/api/notes';

function App() {
  const [notes, setNotes] = useState([]);

  // Fetch all notes from backend
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await axios.get(API_URL);
        // Sort descending by ID (newest first)
        setNotes(res.data.sort((a, b) => Number(b.id) - Number(a.id)));
      } catch (err) {
        console.error('Error fetching notes:', err);
      }
    };
    fetchNotes();
  }, []);

  const handleSaveNote = async (noteData) => {
    try {
      if (noteData.id) {
        // --- UPDATE ---
        const response = await axios.put(`${API_URL}/${noteData.id}`, noteData);
        const updated = notes.map(n => n.id === noteData.id ? response.data : n)
                             .sort((a, b) => Number(b.id) - Number(a.id));
        setNotes(updated);
        return response.data;
      } else {
        // --- CREATE ---
        const response = await axios.post(API_URL, noteData);
        setNotes([...notes, response.data].sort((a, b) => Number(b.id) - Number(a.id)));
        return response.data;
      }
    } catch (err) {
      console.error('Error saving note:', err);
      // Return null or throw error to indicate failure
      return null;
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`${API_URL}/${noteId}`);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const recentNotes = notes.slice(0, 3);

  // Main App component now handles routing
  return (
    <div className="App">
      <header className="app-header">
        <h1><Link to="/" className="header-link">The Crimson Cipher</Link></h1>
        <div className="header-nav-group">
          <nav className="main-nav">
            <Link to="/">Home</Link>
            <Link to="/sessions">Sessions</Link>
          </nav>
          <Link to="/sessions/new" className="btn-primary">+ Add Session</Link>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                recentNotes={recentNotes}
              />
            }
          />
          <Route path="/sessions" element={
              <AllSessionsPage
                notes={notes}
              />
            }
          />
          <Route
            path="/sessions/new"
            element={
              <AddNotePage onSaveNote={handleSaveNote} />
            }
          />
          <Route
            path="/notes/:noteId"
            element={
              <NoteDetailPage
                notes={notes}
                onSaveNote={handleSaveNote}
                onDeleteNote={handleDeleteNote}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

// --- Page Components ---

function HomePage({ recentNotes }) {
  return (
    <>
      <section className="homepage-section">
        <h2>Recent Dispatches</h2>
        {recentNotes.length ? (
          recentNotes.map(note => (
            <Link to={`/notes/${note.id}`} key={note.id} className="note-link">
              <div className="note-card-summary">
                <h3>{note.title}</h3>
                <p>{note.content.substring(0, 100)}...</p>
              </div>
            </Link>
          ))
        ) : <p>No session notes yet. Time to start the adventure!</p>}
      </section>
    </>
  );
}

function AllSessionsPage({ notes }) {
  return (
    <section className="all-sessions-page">
      <h2>Full Campaign Log</h2>
      <div className="note-list-full">
        {notes.map(note => (
          <Link to={`/notes/${note.id}`} key={note.id} className="note-link"><div className="note-card-full">
            <h3>{note.title}</h3>
            <p>{note.content.substring(0, 200)}...</p>
          </div></Link>
        ))}
      </div>
    </section>
  );
}

function AddNotePage({ onSaveNote }) {
  const navigate = useNavigate();

  const handleSave = async (noteData) => {
    const newNote = await onSaveNote(noteData);
    if (newNote) {
      navigate('/'); // Navigate to the homepage
    }
  };

  return (
    <NoteForm note={{}} onSave={handleSave} onCancel={() => navigate('/sessions')} />
  );
}

function NoteDetailPage({ notes, onSaveNote, onDeleteNote }) {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const note = notes.find(n => n.id === Number(noteId));

  const handleDelete = async () => {
    if (note) {
      await onDeleteNote(note.id);
      navigate('/sessions'); // Navigate to sessions list after delete
    }
  };

  if (!note) {
    return <h2>Note not found. <Link to="/">Go Home</Link></h2>;
  }

  return (
    <div className="note-detail-page">
      {isEditing ? (
        <NoteForm
          note={note}
          onSave={async (data) => {
            await onSaveNote({ ...note, ...data });
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="note-card-full">
          <h2>{note.title}</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
          <div className="note-actions">
            <button className="btn-primary" onClick={() => setIsEditing(true)}>Edit</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reusable Form Component ---
function NoteForm({ note, onSave, onCancel }) {
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');

  useEffect(() => {
    setTitle(note.title || '');
    setContent(note.content || '');
  }, [note]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const saveData = async () => {
      await onSave({ title, content });
    };
    saveData();
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <h3>{note.id ? 'Edit Note' : 'Create New Note'}</h3>
      <input
        type="text"
        placeholder="Session Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Session details..."
        value={content}
        onChange={e => setContent(e.target.value)}
        required
      />
      <div className="form-actions">
        <button type="submit" className="btn-primary">Save Note</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default App;
