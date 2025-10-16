'use client';

import { useState } from 'react';

const races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
const classes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];

export default function CharacterForm({ character = {}, onSave, onCancel, notes = [] }) {
  const [name, setName] = useState(character.name || '');
  const [status, setStatus] = useState(character.status || 'Alive');
  const [location, setLocation] = useState(character.location || '');
  const [race, setRace] = useState(character.race || '');
  const [charClass, setCharClass] = useState(character.class || '');
  const [playerType, setPlayerType] = useState(character.playerType || 'Player');
  const [backstory, setBackstory] = useState(character.backstory || '');
  const [selectedSessions, setSelectedSessions] = useState(character.sessions?.map((session) => session.id) || []);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(character.imageUrl || null);

  const handleSessionToggle = (sessionId) => {
    setSelectedSessions((prev) => (prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]));
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
      ...character,
      name,
      status,
      location,
      race,
      class: charClass,
      playerType,
      backstory,
      sessionIds: selectedSessions,
      imageFile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      {character.id && <h3>Edit Character</h3>}
      <div className="form-section character-image-section">
        {imagePreview && <img src={imagePreview} alt="Character preview" className="character-image-preview" />}
        <div className="image-upload-wrapper">
          <label htmlFor="character-image-upload">Character Portrait</label>
          <input
            id="character-image-upload"
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
          <select id="char-status" className="form-select" value={status} onChange={(event) => setStatus(event.target.value)} required>
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
          <select id="char-race" className="form-select" value={race} onChange={(event) => setRace(event.target.value)} required>
            <option value="" disabled>Select a Race</option>
            {races.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="char-class">Class</label>
          <select id="char-class" className="form-select" value={charClass} onChange={(event) => setCharClass(event.target.value)} required>
            <option value="" disabled>Select a Class</option>
            {classes.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="char-type">Player Type</label>
          <select id="char-type" className="form-select" value={playerType} onChange={(event) => setPlayerType(event.target.value)} required>
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
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isNaN(value)) {
                  handleSessionToggle(value);
                }
              }}
              value=""
              className="btn btn-secondary"
            >
              <option value="" disabled>+ Add to Session</option>
              {notes
                .filter((note) => !selectedSessions.includes(note.id))
                .map((note) => (
                  <option key={note.id} value={note.id}>{note.title}</option>
                ))}
            </select>
          </div>
        </div>
        <div className="related-items-list">
          {selectedSessions.length > 0 ? (
            notes
              .filter((note) => selectedSessions.includes(note.id))
              .map((note) => (
                <span key={note.id} className="related-item-pill editable">
                  <span>{note.title}</span>
                  <button type="button" className="pill-close" onClick={() => handleSessionToggle(note.id)}>
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
        <button type="submit" className="btn btn-primary">Save Character</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
