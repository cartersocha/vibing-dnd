'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const DEFAULT_RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
const DEFAULT_CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];

export default function CharacterForm({
  character = {},
  sessions = [],
  action,
  onSuccess,
  redirectTo,
  submitLabel = 'Save Character',
  cancelHref = '/characters'
}) {
  const router = useRouter();
  const [name, setName] = useState(character.name || '');
  const [status, setStatus] = useState(character.status || 'Alive');
  const [location, setLocation] = useState(character.location || '');
  const [race, setRace] = useState(character.race || '');
  const [klass, setKlass] = useState(character.class || '');
  const [playerType, setPlayerType] = useState(character.playerType || 'Player');
  const [backstory, setBackstory] = useState(character.backstory || '');
  const [selectedSessions, setSelectedSessions] = useState(character.sessions?.map((session) => session.id) || []);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(character.imageUrl || null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName(character.name || '');
    setStatus(character.status || 'Alive');
    setLocation(character.location || '');
    setRace(character.race || '');
    setKlass(character.class || '');
    setPlayerType(character.playerType || 'Player');
    setBackstory(character.backstory || '');
    setSelectedSessions(character.sessions?.map((session) => session.id) || []);
    setImagePreview(character.imageUrl || null);
    setImageFile(null);
  }, [character]);

  const availableSessions = useMemo(() => {
    return (sessions || []).filter((session) => !selectedSessions.includes(session.id));
  }, [sessions, selectedSessions]);

  const handleSessionToggle = (id) => {
    setSelectedSessions((prev) =>
      prev.includes(id) ? prev.filter((sessionId) => sessionId !== id) : [...prev, id]
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
    formData.set('name', name);
    formData.set('status', status);
    formData.set('location', location);
    formData.set('race', race);
    formData.set('class', klass);
    formData.set('playerType', playerType);
    formData.set('backstory', backstory);
    formData.set('existingImageUrl', imagePreview || '');
    if (character.id) {
      formData.set('id', String(character.id));
    }
    selectedSessions.forEach((id) => {
      formData.append('sessionIds', String(id));
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
          const target = redirectTo.replace(':id', String(result?.characterId || character?.id || ''));
          router.push(target);
        } else if (character?.id) {
          router.refresh();
        }
      }
    });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      {character.id ? <h3>Edit Character</h3> : <h3>New Character</h3>}
      {error && <p className="error-text">{error}</p>}
      <div className="form-section character-image-section">
        {imagePreview && <img src={imagePreview} alt="Character portrait" className="character-image-preview" />}
        <div className="image-upload-wrapper">
          <label htmlFor="character-image-upload">Character Portrait</label>
          <input
            id="character-image-upload"
            name="image"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageChange}
          />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="char-name">Character Name</label>
          <input
            id="char-name"
            type="text"
            className="form-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="char-status">Status</label>
          <select
            id="char-status"
            className="form-select"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            required
          >
            <option value="Alive">Alive</option>
            <option value="Dead">Dead</option>
            <option value="Missing">Missing</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="char-location">Last Known Location</label>
          <input
            id="char-location"
            type="text"
            className="form-input"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="char-race">Race</label>
          <select
            id="char-race"
            className="form-select"
            value={race}
            onChange={(event) => setRace(event.target.value)}
            required
          >
            <option value="" disabled>
              Select a Race
            </option>
            {DEFAULT_RACES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="char-class">Class</label>
          <select
            id="char-class"
            className="form-select"
            value={klass}
            onChange={(event) => setKlass(event.target.value)}
            required
          >
            <option value="" disabled>
              Select a Class
            </option>
            {DEFAULT_CLASSES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="char-type">Player Type</label>
          <select
            id="char-type"
            className="form-select"
            value={playerType}
            onChange={(event) => setPlayerType(event.target.value)}
            required
          >
            <option value="Player">Player</option>
            <option value="Non-Player">Non-Player</option>
          </select>
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="char-backstory">Backstory &amp; Notes</label>
        <textarea
          id="char-backstory"
          className="form-textarea"
          value={backstory}
          onChange={(event) => setBackstory(event.target.value)}
        />
      </div>
      <div className="form-section form-section-flush-header">
        <div className="page-header">
          <h4>Link to Sessions</h4>
          <div className="add-character-to-session">
            <select
              className="btn btn-secondary"
              value=""
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isNaN(value)) {
                  handleSessionToggle(value);
                  event.target.value = '';
                }
              }}
            >
              <option value="" disabled>
                + Add to Session
              </option>
              {availableSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="related-items-list">
          {selectedSessions.length > 0 ? (
            sessions
              .filter((session) => selectedSessions.includes(session.id))
              .map((session) => (
                <span key={session.id} className="related-item-pill editable">
                  <span>{session.title}</span>
                  <button type="button" className="pill-close" onClick={() => handleSessionToggle(session.id)}>
                    &times;
                  </button>
                </span>
              ))
          ) : (
            <p className="no-items-text">No sessions linked yet.</p>
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
