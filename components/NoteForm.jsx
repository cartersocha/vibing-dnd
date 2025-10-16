'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NoteForm({
  note = {},
  characters = [],
  action,
  onSuccess,
  redirectTo,
  submitLabel = 'Save Session',
  cancelHref = '/sessions'
}) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title || '');
  const [date, setDate] = useState(note.date || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState(note.content || '');
  const [selectedCharacters, setSelectedCharacters] = useState(note.characters?.map((c) => c.id) || []);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(note.imageUrl || null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTitle(note.title || '');
    setDate(note.date || new Date().toISOString().split('T')[0]);
    setContent(note.content || '');
    setSelectedCharacters(note.characters?.map((c) => c.id) || []);
    setImagePreview(note.imageUrl || null);
    setImageFile(null);
  }, [note]);

  const availableCharacters = useMemo(() => {
    return (characters || []).filter((char) => !selectedCharacters.includes(char.id));
  }, [characters, selectedCharacters]);

  const handleCharacterToggle = (id) => {
    setSelectedCharacters((prev) =>
      prev.includes(id) ? prev.filter((charId) => charId !== id) : [...prev, id]
    );
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('title', title);
    formData.set('date', date);
    formData.set('content', content);
    formData.set('existingImageUrl', imagePreview || '');
    if (note.id) {
      formData.set('id', String(note.id));
    }
    selectedCharacters.forEach((id) => {
      formData.append('characterIds', String(id));
    });
    if (imageFile) {
      formData.set('image', imageFile);
    }

    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError('');
        if (typeof onSuccess === 'function') {
          onSuccess(result);
        } else if (redirectTo) {
          const target = redirectTo.replace(':id', String(result?.noteId || note?.id || ''));
          router.push(target);
        } else if (note?.id) {
          router.refresh();
        }
      }
    });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      {note.id ? <h3>Edit Session</h3> : <h3>New Session</h3>}
      {error && <p className="error-text">{error}</p>}
      <div className="form-section character-image-section">
        {imagePreview && <img src={imagePreview} alt="Session banner" className="character-image-preview" />}
        <div className="image-upload-wrapper">
          <label htmlFor="session-image-upload">Session Banner</label>
          <input id="session-image-upload" name="image" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
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
                  event.target.value = '';
                }
              }}
              value=""
              className="btn btn-secondary"
            >
              <option value="" disabled>
                + Add Character
              </option>
              {availableCharacters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="related-items-list">
          {selectedCharacters.length > 0 ? (
            characters
              .filter((char) => selectedCharacters.includes(char.id))
              .map((char) => (
                <span key={char.id} className="related-item-pill editable">
                  <span>{char.name}</span>
                  <button type="button" className="pill-close" onClick={() => handleCharacterToggle(char.id)}>
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
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <Link href={cancelHref} className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
