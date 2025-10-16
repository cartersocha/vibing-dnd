'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import NoteForm from './NoteForm';
import * as noteService from '../services/notes';

export default function NoteDetailPage({ initialNote, characters }) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  const handleDelete = async () => {
    if (!note || isSubmitting) return;
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    setIsSubmitting(true);
    try {
      await noteService.deleteNote(note.id);
      router.push('/sessions');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (formData) => {
    if (!note) return;
    setIsSubmitting(true);
    try {
      let imageUrl = note.imageUrl || null;
      if (formData.imageFile) {
        const upload = await noteService.uploadImage(formData.imageFile);
        imageUrl = upload.url;
      }

      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('date', formData.date);
      payload.append('content', formData.content);
      if (imageUrl) {
        payload.append('imageUrl', imageUrl);
      } else {
        payload.append('imageUrl', '');
      }
      formData.characterIds.forEach((id) => payload.append('characterIds', String(id)));

      const updated = await noteService.updateNote(note.id, payload);
      setNote(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCharacterToSession = async (characterId) => {
    if (!note) return;
    try {
      await noteService.addCharacterToSession(note.id, Number(characterId));
      const refreshed = await noteService.fetchNote(note.id);
      setNote(refreshed);
    } catch (error) {
      console.error('Error linking character:', error);
      alert(error.message);
    }
  };

  const removeCharacterFromSession = async (characterId) => {
    if (!note) return;
    try {
      await noteService.removeCharacterFromSession(note.id, Number(characterId));
      const refreshed = await noteService.fetchNote(note.id);
      setNote(refreshed);
    } catch (error) {
      console.error('Error unlinking character:', error);
      alert(error.message);
    }
  };

  if (!note) {
    return <h2>Session not found. <button type="button" className="btn btn-secondary" onClick={() => router.push('/')}>Go Home</button></h2>;
  }

  const availableCharacters = characters.filter(
    (character) => !note.characters?.some((linked) => linked.id === character.id),
  );

  return (
    <div className="note-detail-page">
      {isEditing ? (
        <NoteForm
          note={note}
          characters={characters}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="card">
          {note.imageUrl && (
            <img src={note.imageUrl} alt={note.title} className="session-banner-image" />
          )}
          <div className="page-header">
            <div>
              <h2>Session {note.sessionNumber}: {note.title}</h2>
              {note.date && <p className="session-date-header">{new Date(note.date).toLocaleDateString()}</p>}
            </div>
            <div className="header-actions-group">
              <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
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
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isNaN(value)) {
                      addCharacterToSession(value);
                    }
                  }}
                  value=""
                  className="btn btn-secondary"
                >
                  <option value="" disabled>+ Add Character</option>
                  {availableCharacters.map((character) => (
                    <option key={character.id} value={character.id}>{character.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {note.characters && note.characters.length > 0 ? (
            <div className="related-items-list">
              {note.characters.map((character) => (
                <span key={character.id} className="related-item-pill editable">
                  <button
                    type="button"
                    className="pill-link"
                    onClick={() => router.push(`/characters/${character.id}`)}
                  >
                    {character.name}
                  </button>
                  <button className="pill-close" onClick={() => removeCharacterFromSession(character.id)}>&times;</button>
                </span>
              ))}
            </div>
          ) : (
            <p className="no-items-text">No characters have been added to this session yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
