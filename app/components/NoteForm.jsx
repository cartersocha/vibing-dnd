'use client';

import { useEffect, useState } from 'react';

export default function NoteForm({ note = {}, onSave, onCancel, characters = [] }) {
  const [title, setTitle] = useState(note.title || '');
  const [date, setDate] = useState(note.date || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState(note.content || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(note.imageUrl || null);
  const [selectedCharacters, setSelectedCharacters] = useState(note.characters?.map((character) => character.id) || []);

  useEffect(() => {
    setTitle(note.title || '');
    setDate(note.date || new Date().toISOString().split('T')[0]);
    setContent(note.content || '');
    setImagePreview(note.imageUrl || null);
    setSelectedCharacters(note.characters?.map((character) => character.id) || []);
  }, [note]);

  const handleCharacterToggle = (characterId) => {
    setSelectedCharacters((prev) => (prev.includes(characterId) ? prev.filter((id) => id !== characterId) : [...prev, characterId]));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave({
      ...note,
      title,
      date,
      content,
      characterIds: selectedCharacters,
      imageFile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      {note.id && <h3>Edit Session</h3>}
      <div className="form-section character-image-section">
        {imagePreview && <img src={imagePreview} alt="Session preview" className="character-image-preview" />}
        <div className="image-upload-wrapper">
          <label htmlFor="session-image-upload">Session Banner</label>
          <input
            id="session-image-upload"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageChange}
          />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="note-title">Session Title</label>
          <input
            id="note-title"
            type="text"
            className="form-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="note-date">Session Date</label>
          <input
            id="note-date"
            type="date"
            className="form-input"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="note-content">Session Details</label>
        <textarea
          id="note-content"
          className="form-textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
        />
      </div>
      <div className="form-section form-section-flush-header">
        <div className="page-header">
          <h4>Characters in this Session</h4>
          <div className="add-character-to-session">
            <select
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isNaN(value)) {
                  handleCharacterToggle(value);
                }
              }}
              value=""
              className="btn btn-secondary"
            >
              <option value="" disabled>+ Add Character</option>
              {characters
                .filter((character) => !selectedCharacters.includes(character.id))
                .map((character) => (
                  <option key={character.id} value={character.id}>{character.name}</option>
                ))}
            </select>
          </div>
        </div>
        <div className="related-items-list">
          {selectedCharacters.length > 0 ? (
            characters
              .filter((character) => selectedCharacters.includes(character.id))
              .map((character) => (
                <span key={character.id} className="related-item-pill editable">
                  <span>{character.name}</span>
                  <button type="button" className="pill-close" onClick={() => handleCharacterToggle(character.id)}>
                    &times;
                  </button>
                </span>
              ))
          ) : (
            <p className="no-items-text">No characters linked yet.</p>
          )}
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Save Session</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
