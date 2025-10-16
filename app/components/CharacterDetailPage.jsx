'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import CharacterForm from './CharacterForm';
import * as characterService from '../services/characters';
import * as noteService from '../services/notes';

export default function CharacterDetailPage({ initialCharacter, notes }) {
  const router = useRouter();
  const [character, setCharacter] = useState(initialCharacter);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCharacter(initialCharacter);
  }, [initialCharacter]);

  if (!character) {
    return <h2>Character not found. <button type="button" className="btn btn-secondary" onClick={() => router.push('/characters')}>Return to List</button></h2>;
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this character?')) return;
    setIsSubmitting(true);
    try {
      await characterService.deleteCharacter(character.id);
      router.push('/characters');
    } catch (error) {
      console.error('Error deleting character:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (formData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = character.imageUrl || null;
      if (formData.imageFile) {
        const upload = await characterService.uploadImage(formData.imageFile);
        imageUrl = upload.url;
      }

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('status', formData.status);
      payload.append('location', formData.location || '');
      payload.append('race', formData.race);
      payload.append('class', formData.class);
      payload.append('playerType', formData.playerType);
      payload.append('backstory', formData.backstory || '');
      if (imageUrl) {
        payload.append('imageUrl', imageUrl);
      } else {
        payload.append('imageUrl', '');
      }
      formData.sessionIds.forEach((id) => payload.append('sessionIds', String(id)));

      const updated = await characterService.updateCharacter(character.id, payload);
      setCharacter(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating character:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSessionToCharacter = async (sessionId) => {
    try {
      await noteService.addCharacterToSession(sessionId, character.id);
      const refreshed = await characterService.fetchCharacter(character.id);
      setCharacter(refreshed);
    } catch (error) {
      console.error('Error adding session:', error);
      alert(error.message);
    }
  };

  const removeSessionFromCharacter = async (sessionId) => {
    try {
      await noteService.removeCharacterFromSession(sessionId, character.id);
      const refreshed = await characterService.fetchCharacter(character.id);
      setCharacter(refreshed);
    } catch (error) {
      console.error('Error removing session:', error);
      alert(error.message);
    }
  };

  const availableSessions = notes.filter(
    (note) => !character.sessions?.some((session) => session.id === note.id),
  );

  return (
    <div>
      {isEditing ? (
        <CharacterForm
          character={character}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          notes={notes}
        />
      ) : (
        <div className="character-detail-layout">
          <div className="character-detail-main">
            <div className="page-header">
              <h2>{character.name}</h2>
              <div className="header-actions-group">
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={isSubmitting}>
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            <div className="character-stats">
              <span><strong>Race:</strong> {character.race}</span>
              <span><strong>Class:</strong> {character.class}</span>
              <span><strong>Type:</strong> {character.playerType}</span>
              <span><strong>Status:</strong> {character.status}</span>
              <span><strong>Location:</strong> {character.location}</span>
            </div>

            <div className="card">
              <h3>Backstory &amp; Notes</h3>
              <div className="markdown-content">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{character.backstory}</ReactMarkdown>
              </div>
            </div>

            <div className="card">
              <div className="page-header">
                <h3>Related Sessions</h3>
                {availableSessions.length > 0 && (
                  <div className="add-character-to-session">
                    <select
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (!Number.isNaN(value)) {
                          addSessionToCharacter(value);
                        }
                      }}
                      value=""
                      className="btn btn-primary"
                    >
                      <option value="" disabled>+ Add to Session</option>
                      {availableSessions.map((note) => (
                        <option key={note.id} value={note.id}>{note.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {character.sessions && character.sessions.length > 0 ? (
                <div className="related-items-list">
                  {character.sessions.map((session) => (
                    <span key={session.id} className="related-item-pill editable">
                      <button type="button" className="pill-link" onClick={() => router.push(`/notes/${session.id}`)}>
                        {session.title}
                      </button>
                      <button className="pill-close" onClick={() => removeSessionFromCharacter(session.id)}>&times;</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p>This character has not appeared in any sessions yet.</p>
              )}
            </div>
          </div>

          <div className="character-detail-sidebar">
            {character.imageUrl && (
              <div className="character-portrait-container">
                <img src={character.imageUrl} alt={character.name} className="character-portrait-large" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
