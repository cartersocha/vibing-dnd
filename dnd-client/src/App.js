import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_URL = 'http://localhost:5001/api/notes';
const CHAR_API_URL = 'http://localhost:5001/api/characters';

function App() {
  const [notes, setNotes] = useState([]);
  const [characters, setCharacters] = useState([]);
  
  const fetchCharacters = useCallback(async () => {
    try {
      const res = await axios.get(CHAR_API_URL);
      // Sort alphabetically by name
      setCharacters(res.data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Error fetching characters:', err);
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await axios.get(API_URL);
      // Sort descending by ID (newest first)
      setNotes(res.data.sort((a, b) => Number(b.id) - Number(a.id)));
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  }, []);

  // Fetch initial data on component mount
  useEffect(() => {
    fetchNotes();
    fetchCharacters();
    // The empty dependency array ensures this runs only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveNote = async (noteData) => {
    try {
      if (noteData.id) {
        // --- UPDATE ---
        const response = await axios.put(`${API_URL}/${noteData.id}`, noteData);

        // Handle relationship changes
        const originalNote = notes.find(n => n.id === noteData.id);
        const originalCharIds = originalNote.characters?.map(c => c.id) || [];
        const newCharIds = noteData.characterIds || [];

        const toAdd = newCharIds.filter(id => !originalCharIds.includes(id));
        const toRemove = originalCharIds.filter(id => !newCharIds.includes(id));

        const addPromises = toAdd.map(charId => axios.post(`${API_URL}/${noteData.id}/characters`, { characterId: charId }));
        const removePromises = toRemove.map(charId => axios.delete(`${API_URL}/${noteData.id}/characters/${charId}`));

        await Promise.all([...addPromises, ...removePromises]);

        handleDataChange(); // Refresh all data to get updated relationships

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

  const handleSaveCharacter = async (charData) => {
    try {
      if (charData.id) {
        // --- UPDATE ---
        const formData = new FormData();
        for (const key in charData) {
          // Skip complex objects that FormData can't handle
          if (key === 'sessions' || key === 'sessionIds') {
            continue;
          }
          // Append all other fields, including the image file if it exists.
          // A null or undefined value for 'image' will be handled correctly.
          if (charData[key] !== undefined) {
            formData.append(key, charData[key]);
          }
        }

        const response = await axios.put(`${CHAR_API_URL}/${charData.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // The logic for updating session relationships remains the same
        // and would be handled separately if needed.

        const updated = characters.map(c => c.id === charData.id ? response.data : c)
                                  .sort((a, b) => a.name.localeCompare(b.name));
        setCharacters(updated);
        return response.data;
      } else {
        // --- CREATE ---
        const formData = new FormData();
        for (const key in charData) {
          // Skip complex objects and undefined/null values that FormData can't handle
          if (key === 'sessionIds' || charData[key] === null || charData[key] === undefined) {
            continue;
          }
          formData.append(key, charData[key]);
        }

        const response = await axios.post(CHAR_API_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const newChar = response.data;

        // If sessions were selected, create those relationships now
        if (charData.sessionIds && charData.sessionIds.length > 0) {
          const relationshipPromises = charData.sessionIds.map(sessionId =>
            axios.post(`${API_URL}/${sessionId}/characters`, { characterId: newChar.id })
          );
          await Promise.all(relationshipPromises);
        }

        setCharacters([...characters, newChar].sort((a, b) => a.name.localeCompare(b.name)));
        return response.data;
      }
    } catch (err) {
      console.error('Error saving character:', err);
      return null;
    }
  };

  const handleDeleteCharacter = async (charId) => {
    if (!window.confirm('Are you sure you want to permanently delete this character?')) return;
    try {
      await axios.delete(`${CHAR_API_URL}/${charId}`);
      setCharacters(characters.filter(c => c.id !== charId));
    } catch (err) {
      console.error('Error deleting character:', err);
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

  const handleDataChange = () => {
    fetchNotes();
    fetchCharacters();
  };

  const numberedNotes = React.useMemo(() => {
    if (!notes || notes.length === 0) return [];

    // Create a sorted copy to determine chronological order
    const sortedByDate = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Create a map of id to session number for efficient lookup
    const sessionNumberMap = new Map(sortedByDate.map((note, index) => [note.id, index + 1]));

    // Return the original notes array with the session number added
    return notes.map(note => ({ ...note, sessionNumber: sessionNumberMap.get(note.id) }));
  }, [notes]);

  const recentNotes = numberedNotes.slice(0, 3);

  // Main App component now handles routing
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <h1><Link to="/" className="header-link">Tyranny of Dragons</Link></h1>
        </div>
        <nav className="main-nav">
          <Link to="/sessions">Sessions</Link>
          <Link to="/characters">Characters</Link>
          <Link to="/calendar">Calendar</Link>
          <Link to="/map">Map</Link>
        </nav>
      </aside>

      <div className="app-content">
        <Routes>
          <Route path="/" element={
            <div className="container">
              <HomePage
                recentNotes={recentNotes}
              />
            </div>
          } />
          <Route path="/sessions" element={
            <div className="container">
              <AllSessionsPage
                notes={numberedNotes}
              />
            </div>
          } />
          <Route
            path="/characters"
            element={<div className="container"><CharactersPage characters={characters} /></div>} />
          <Route
            path="/characters/new"
            element={
              <div className="container"><AddCharacterPage onSaveCharacter={handleSaveCharacter} notes={numberedNotes} characters={characters} /></div>
            } />
          <Route
            path="/characters/:charId"
            element={
              <div className="container">
                <CharacterDetailPage
                  notes={numberedNotes}
                  onSaveCharacter={handleSaveCharacter}
                  onDeleteCharacter={handleDeleteCharacter}
                  onDataChange={handleDataChange}
                />
              </div>
            } />
          <Route
            path="/sessions/new"
            element={
              <div className="container"><AddNotePage onSaveNote={handleSaveNote} characters={characters} /></div>
            } />
          <Route
            path="/notes/:noteId"
            element={
              <div className="container">
                <NoteDetailPage
                  notes={numberedNotes}
                  characters={characters}
                  onSaveNote={handleSaveNote}
                  onDeleteNote={handleDeleteNote}
                  onDataChange={handleDataChange}
                />
              </div>
            } />
          <Route
            path="/calendar"
            element={
              <CalendarPage notes={numberedNotes} />
            } />
          <Route
            path="/map"
            element={
              <MapPage />
            } />
        </Routes>
      </div>
    </div>
  );
}

// --- Page Components ---

function CharactersPage({ characters }) {
  const navigate = useNavigate();
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  const handleSort = (event, key) => {
    // Don't sort if the click was on the filter button
    if (event.target.closest('.filter-icon')) return;

    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const activeFilters = Object.entries(columnFilters).filter(([, value]) => value);

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const sortedAndFilteredCharacters = React.useMemo(() => {
    let filtered = [...characters];

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(char => String(char[key]) === String(value));
      }
    });

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [characters, columnFilters, sortConfig]);

  const getColumnOptions = (key) => {
    return [...new Set(characters.map(c => c[key]))].filter(Boolean).sort();
  };

  return (
    <section>
      <div className="page-header">
        <h2>Characters</h2>
        <Link to="/characters/new" className="btn-primary">+ Create Character</Link>
      </div>
      {activeFilters.length > 0 && (
        <div className="active-filters-container">
          <span className="active-filters-label">Active Filters:</span>
          <div className="pills-wrapper">
            {activeFilters.map(([key, value]) => (
              <span key={key} className="filter-pill">
                {key}: {value}
                <button className="pill-close" onClick={() => handleFilterChange(key, '')}>&times;</button>
              </span>
            ))}
          </div>
          <button className="btn-secondary" onClick={() => setColumnFilters({})}>Clear All</button>
        </div>
      )}
      <table className="characters-table">
        <thead>
          <tr>
            <th onClick={(e) => handleSort(e, 'name')}>
              <div className="th-content">
                <span>Name{getSortIndicator('name')}</span>
                <ColumnFilter columnKey="name" options={getColumnOptions('name')} onChange={handleFilterChange} value={columnFilters.name} />
              </div>
            </th>
            <th onClick={(e) => handleSort(e, 'race')}>
              <div className="th-content">
                <span>Race{getSortIndicator('race')}</span>
                <ColumnFilter columnKey="race" options={getColumnOptions('race')} onChange={handleFilterChange} value={columnFilters.race} />
              </div>
            </th>
            <th onClick={(e) => handleSort(e, 'class')}>
              <div className="th-content">
                <span>Class{getSortIndicator('class')}</span>
                <ColumnFilter columnKey="class" options={getColumnOptions('class')} onChange={handleFilterChange} value={columnFilters.class} />
              </div>
            </th>
            <th onClick={(e) => handleSort(e, 'playerType')}>
              <div className="th-content">
                <span>Type{getSortIndicator('playerType')}</span>
                <ColumnFilter columnKey="playerType" options={getColumnOptions('playerType')} onChange={handleFilterChange} value={columnFilters.playerType} />
              </div>
            </th>
            <th onClick={(e) => handleSort(e, 'status')}>Status{getSortIndicator('status')}</th>
            <th onClick={(e) => handleSort(e, 'location')}>Last Known Location{getSortIndicator('location')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedAndFilteredCharacters.length > 0 ? (
            sortedAndFilteredCharacters.map(char => (
              <tr key={char.id} onClick={() => navigate(`/characters/${char.id}`)}>
                <td>{char.name}</td>
                <td>{char.race}</td>
                <td>{char.class}</td>
                <td>{char.playerType}</td>
                <td>{char.status}</td>
                <td>{char.location}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="6">No characters match the current filters.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function HomePage({ recentNotes }) {
  return (
    <>
      <section>
        <div className="page-header">
          <h2>Recent Dispatches</h2>
          <Link to="/sessions/new" className="btn-primary">+ Add Session</Link>
        </div>
        {recentNotes.length ? (
          recentNotes.map(note => (
            <Link to={`/notes/${note.id}`} key={note.id} className="note-link">
              <div className="note-card-summary">
                <div className="page-header">
                  <h3>Session {note.sessionNumber}: {note.title}</h3>
                  {note.date && <span className="session-date">{new Date(note.date).toLocaleDateString()}</span>}
                </div>
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
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest, 'asc' for oldest

  const sortedNotes = React.useMemo(() => {
    const sortableNotes = [...notes];
    sortableNotes.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.id - b.id; // Oldest first
      }
      return b.id - a.id; // Newest first
    });
    return sortableNotes;
  }, [notes, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prevOrder => (prevOrder === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <section className="all-sessions-page">
      <div className="page-header">
        <h2>Full Campaign Log</h2>
        <div className="header-actions-group">
          <button onClick={toggleSortOrder} className="btn-secondary">
            Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
          <Link to="/sessions/new" className="btn-primary">+ Add Session</Link>
        </div>
      </div>
      <div className="note-list-full">
        {sortedNotes.map(note => (
          <Link to={`/notes/${note.id}`} key={note.id} className="note-link"><div className="note-card-full">
            <div className="page-header">
              <h3>Session {note.sessionNumber}: {note.title}</h3>
              {note.date && <span className="session-date">{new Date(note.date).toLocaleDateString()}</span>}
            </div>
            <div className="markdown-content">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{`${note.content.substring(0, 200)}...`}</ReactMarkdown>
            </div>
          </div></Link>
        ))}
      </div>
    </section>
  );
}

function MapPage() {
  return (
    <section>
      <div className="page-header">
        <h2>World Map</h2>
      </div>
      <div className="map-placeholder-container">
        <div className="map-placeholder">
          <p>The world map will be displayed here.</p>
        </div>
      </div>
    </section>
  );
}

function CalendarPage({ notes }) {
  const navigate = useNavigate();
  const [activeDate, setActiveDate] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [sessionsForPopup, setSessionsForPopup] = useState([]);

  // Create a lookup map for session dates for efficient access
  const sessionDateMap = React.useMemo(() => {
    const map = new Map();
    notes.forEach(note => {
      if (note.date) {
        // Normalize date to ignore time zones and time parts
        const dateKey = new Date(note.date).toDateString();
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey).push(note);
      }
    });
    return map;
  }, [notes]);

  const handleMouseEnter = (event, date) => {
    const dateKey = date.toDateString();
    if (sessionDateMap.has(dateKey)) {
      const rect = event.currentTarget.getBoundingClientRect();
      setPopupPosition({ top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX });
      setSessionsForPopup(sessionDateMap.get(dateKey));
      setActiveDate(date);
    }
  };

  const handleMouseLeave = () => {
    setActiveDate(null);
    setSessionsForPopup([]);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateKey = date.toDateString();
      if (sessionDateMap.has(dateKey)) {
        return (
          <div className="session-marker-wrapper" onMouseEnter={(e) => handleMouseEnter(e, date)} onMouseLeave={handleMouseLeave}>
            <div className="session-marker"></div>
          </div>
        );
      }
    }
    return null;
  };

  const handleDayClick = (value) => {
    const dateKey = value.toDateString();
    if (sessionDateMap.has(dateKey)) {
      const sessionsOnDay = sessionDateMap.get(dateKey);
      // Navigate to the first session on that day
      navigate(`/notes/${sessionsOnDay[0].id}`);
    }
  };

  return (
    <section>
      <div className="page-header">
        <h2>Campaign Calendar</h2>
      </div>
      <div className="calendar-container">
        <Calendar
          tileContent={tileContent}
          onClickDay={handleDayClick}
        />
      </div>
      {activeDate && sessionsForPopup.length > 0 && (
        <div className="calendar-popup" style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}>
          <div className="calendar-popup-header">
            {activeDate.toLocaleDateString()}
          </div>
          <ul>
            {sessionsForPopup.map(session => (
              <li key={session.id}>{session.title}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function CharacterDetailPage({ notes, onSaveCharacter, onDeleteCharacter, onDataChange }) {
  const { charId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const res = await axios.get(`${CHAR_API_URL}/${charId}`);
        setCharacter(res.data);
      } catch (err) {
        console.error("Error fetching character details:", err);
        setCharacter(null);
      }
    };
    fetchCharacter();
  }, [charId, isEditing]);

  const handleDelete = async () => {
    if (character) {
      await onDeleteCharacter(character.id);
      navigate('/characters');
    }
  };

  const handleSaveWrapper = async (data) => {
    const saved = await onSaveCharacter({ ...character, ...data });
    if (saved) {
      setIsEditing(false);
    }
  };

  const addSessionToCharacter = async (sessionId) => {
    try {
      await axios.post(`${API_URL}/${sessionId}/characters`, { characterId: character.id });
      onDataChange(); // Tell the App to refetch all data
    } catch (err) {
      console.error("Error adding session to character:", err);
      alert(err.response?.data?.message || "Could not add session.");
    }
  };

  const removeSessionFromCharacter = async (sessionId) => {
    try {
      await axios.delete(`${API_URL}/${sessionId}/characters/${character.id}`);
      onDataChange(); // Tell the App to refetch all data
    } catch (err) {
      console.error("Error removing session from character:", err);
    }
  };

  // Find sessions that this character is NOT a part of
  const availableSessions = notes.filter(
    note => !character?.sessions?.some(cs => cs.id === note.id)
  );

  if (character === null) {
    return <h2>Loading Character...</h2>;
  }

  if (!character) {
    return <h2>Character not found. <Link to="/characters">Return to List</Link></h2>;
  }

  return (
    <div className="character-detail-page">
      {isEditing ? (
        <CharacterForm
          character={character}
          onSave={handleSaveWrapper}
          onCancel={() => setIsEditing(false)}
          notes={notes}
        />
      ) : (
        <div className="character-detail-layout">
          <div className="character-detail-main">
            <div className="page-header">
              <h2>{character.name}</h2>
              <div className="note-actions">
                <button className="btn-primary" onClick={() => setIsEditing(true)}>Edit</button>
                <button className="btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
            <div className="character-stats">
              <span><strong>Race:</strong> {character.race}</span>
              <span><strong>Class:</strong> {character.class}</span>
              <span><strong>Type:</strong> {character.playerType}</span>
              <span><strong>Status:</strong> {character.status}</span>
              <span><strong>Location:</strong> {character.location}</span>
            </div>
            <h3>Backstory & Notes</h3>
            <div className="markdown-content">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{character.backstory}</ReactMarkdown>
            </div>
            <hr />
            <div className="page-header">
              <h3>Related Sessions</h3>
              {availableSessions.length > 0 && (
                <div className="add-character-to-session">
                  <select
                    onChange={(e) => addSessionToCharacter(e.target.value)}
                    value=""
                    className="btn-secondary"
                  >
                    <option value="" disabled>+ Add to Session</option>
                    {availableSessions.map(note => <option key={note.id} value={note.id}>{note.title}</option>)}
                  </select>
                </div>
              )}
            </div>
            {character.sessions && character.sessions.length > 0 ? (
              <div className="related-items-list">
                {character.sessions.map(session => (
                  <span key={session.id} className="related-item-pill editable">
                    <Link to={`/notes/${session.id}`}>{session.title}</Link>
                    <button className="pill-close" onClick={() => removeSessionFromCharacter(session.id)}>&times;</button>
                  </span>
                ))}
              </div>
            ) : <p>This character has not appeared in any sessions yet.</p>}
          </div>
          <div className="character-detail-sidebar">
            {character.imageUrl && (
              <div className="character-portrait-container">
                <img src={`http://localhost:5001${character.imageUrl}`} alt={character.name} className="character-portrait-large" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddCharacterPage({ onSaveCharacter, notes, characters }) {
  const navigate = useNavigate();

  const handleSave = async (charData) => {
    const newChar = await onSaveCharacter(charData);
    if (newChar) {
      navigate('/characters'); // Navigate to the characters list
    }
  };

  return (
    <CharacterForm character={{}} onSave={handleSave} onCancel={() => navigate('/characters')} notes={notes} characters={characters} />
  );
}

function AddNotePage({ onSaveNote, characters }) {
  const navigate = useNavigate();

  const handleSave = async (noteData) => {
    const newNote = await onSaveNote(noteData);
    if (newNote) {
      navigate('/'); // Navigate to the homepage
    }
  };

  return (
    <NoteForm note={{}} onSave={handleSave} onCancel={() => navigate('/sessions')} characters={characters} />
  );
}

function NoteDetailPage({ notes, characters, onSaveNote, onDeleteNote, onDataChange }) {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await axios.get(`${API_URL}/${noteId}`);
        setNote(res.data);
      } catch (err) {
        console.error("Error fetching note details:", err);
        setNote(null);
      }
    };
    fetchNote();
  }, [noteId, isEditing]);

  const handleDelete = async () => {
    if (note) {
      await onDeleteNote(note.id);
      navigate('/sessions'); // Navigate to sessions list after delete
    }
  };

  const handleSaveWrapper = async (data) => {
    const saved = await onSaveNote({ ...note, ...data });
    if (saved) {
      setIsEditing(false);
    }
  };

  const addCharacterToSession = async (characterId) => {
    try {
      await axios.post(`${API_URL}/${noteId}/characters`, { characterId: Number(characterId) });
      // Refetch this specific note's data to show the new character
      const res = await axios.get(`${API_URL}/${noteId}`);
      setNote(res.data);
      onDataChange(); // Also refresh the main character list in App for other components
    } catch (err) {
      console.error("Error adding character to session:", err);
      alert(err.response?.data?.message || "Could not add character.");
    }
  };

  const removeCharacterFromSession = async (characterId) => {
    try {
      await axios.delete(`${API_URL}/${noteId}/characters/${characterId}`);
      // Refetch this specific note's data to show the character was removed
      const res = await axios.get(`${API_URL}/${noteId}`);
      setNote(res.data);
      onDataChange(); // Also refresh the main character list in App for other components
    } catch (err) {
      console.error("Error removing character from session:", err);
    }
  };

  const availableCharacters = characters.filter(
    char => !note?.characters?.some(nc => nc.id === char.id)
  );

  if (note === null) {
    return <h2>Loading Session...</h2>;
  }

  if (!note) {
    return <h2>Note not found. <Link to="/">Go Home</Link></h2>;
  }

  return (
    <div className="note-detail-page">
      {isEditing ? (
        <NoteForm
          note={note}
          onSave={handleSaveWrapper}
          onCancel={() => setIsEditing(false)}
          characters={characters}
        />
      ) : (
        <div className="note-card-full">
          <div className="page-header">
            <div>
              <h2>Session {note.sessionNumber}: {note.title}</h2>
              {note.date && <p className="session-date-header">{new Date(note.date).toLocaleDateString()}</p>}
            </div>
            <div className="note-actions">
              <button className="btn-primary" onClick={() => setIsEditing(true)}>Edit</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
          <div className="markdown-content">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{note.content}</ReactMarkdown>
          </div>
          <hr />
          <div className="page-header">
            <h3>Characters in this Session</h3>
            {availableCharacters.length > 0 && (
              <div className="add-character-to-session">
                <select
                  onChange={(e) => addCharacterToSession(e.target.value)}
                  value=""
                  className="btn-primary"
                >
                  <option value="" disabled>+ Add Character</option>
                  {availableCharacters.map(char => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {note.characters && note.characters.length > 0 ? (
            <div className="related-items-list">
              {note.characters.map(char => (
                <span key={char.id} className="related-item-pill editable">
                  <Link to={`/characters/${char.id}`}>{char.name}</Link>
                  <button className="pill-close" onClick={() => removeCharacterFromSession(char.id)}>&times;</button>
                </span>
              ))}
            </div>
          ) : <p>No characters have been added to this session yet.</p>}

        </div>
      )}
    </div>
  );
}

// --- Reusable Form Component ---
function NoteForm({ note, onSave, onCancel, characters = [] }) {
  const [title, setTitle] = useState(note.title || '');
  const [date, setDate] = useState(note.date || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState(note.content || '');
  const [selectedCharacters, setSelectedCharacters] = useState(note.characters?.map(c => c.id) || []);

  useEffect(() => {
    setTitle(note.title || '');
    setDate(note.date || new Date().toISOString().split('T')[0]);
    setContent(note.content || '');
    setSelectedCharacters(note.characters?.map(c => c.id) || []);
  }, [note]);

  const handleCharacterToggle = (charId) => {
    setSelectedCharacters(prev =>
      prev.includes(charId) ? prev.filter(id => id !== charId) : [...prev, charId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...note, title, date, content, characterIds: selectedCharacters });
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      {note.id && <h3>Edit Note</h3>}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="note-title">Session Title</label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="note-date">Session Date</label>
          <input
            id="note-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="note-content">Session Details</label>
        <textarea
          id="note-content"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
      </div>
      <div className="form-section form-section-flush-header">
        <div className="page-header">
          <h4>Characters in this Session</h4>
          <div className="add-character-to-session">
            <select
              onChange={(e) => handleCharacterToggle(Number(e.target.value))}
              value=""
              className="btn-secondary"
            >
              <option value="" disabled>+ Add Character</option>
              {characters
                .filter(char => !selectedCharacters.includes(char.id))
                .map(char => <option key={char.id} value={char.id}>{char.name}</option>)
              }
            </select>
          </div>
        </div>
        <div className="related-items-list">
          {selectedCharacters.length > 0 ? (
            characters
              .filter(char => selectedCharacters.includes(char.id))
              .map(char => (
                <span key={char.id} className="related-item-pill editable">
                  <span>{char.name}</span>
                  <button type="button" className="pill-close" onClick={() => handleCharacterToggle(char.id)}>&times;</button>
                </span>
              ))
          ) : (
            <p className="no-items-text">No characters linked yet.</p>
          )}
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">Save Note</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// --- Reusable Character Form Component ---
function CharacterForm({ character, onSave, onCancel, notes = [], characters = [] }) {
  const [name, setName] = useState(character.name || '');
  const [status, setStatus] = useState(character.status || 'Alive');
  const [location, setLocation] = useState(character.location || '');
  const [race, setRace] = useState(character.race || '');
  const [charClass, setCharClass] = useState(character.class || '');
  const [playerType, setPlayerType] = useState(character.playerType || 'Player');
  const [backstory, setBackstory] = useState(character.backstory || '');
  const [selectedSessions, setSelectedSessions] = useState(character.sessions?.map(s => s.id) || []);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(character.imageUrl ? `http://localhost:5001${character.imageUrl}` : null);

  const races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
  const classes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];

  const handleSessionToggle = (sessionId) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId) ? prev.filter(id => id !== sessionId) : [...prev, sessionId]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const saveData = {
      name,
      status,
      location,
      race,
      class: charClass,
      playerType,
      backstory,
      sessionIds: selectedSessions,
      image: imageFile,
      imageUrl: character.imageUrl // Preserve the existing imageUrl
    };
    if (character.id) {
      saveData.id = character.id;
    }
    onSave(saveData);
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
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
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="char-status">Status</label>
          <select id="char-status" value={status} onChange={e => setStatus(e.target.value)} required>
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
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="char-race">Race</label>
          <select id="char-race" value={race} onChange={e => setRace(e.target.value)} required>
            <option value="" disabled>Select a Race</option>
            {races.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="char-class">Class</label>
          <select id="char-class" value={charClass} onChange={e => setCharClass(e.target.value)} required>
            <option value="" disabled>Select a Class</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="char-type">Player Type</label>
          <select id="char-type" value={playerType} onChange={e => setPlayerType(e.target.value)} required>
            <option value="Player">Player</option>
            <option value="Non-Player">Non-Player</option>
          </select>
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="char-backstory">Backstory & Notes</label>
        <textarea
          id="char-backstory"
          value={backstory}
          onChange={e => setBackstory(e.target.value)}
        />
      </div>
      <div className="form-section form-section-flush-header">
        <div className="page-header">
          <h4>Link to Sessions</h4>
          <div className="add-character-to-session">
            <select
              onChange={(e) => handleSessionToggle(Number(e.target.value))}
              value=""
              className="btn-secondary"
            >
              <option value="" disabled>+ Add to Session</option>
              {notes
                .filter(note => !selectedSessions.includes(note.id))
                .map(note => <option key={note.id} value={note.id}>{note.title}</option>)
              }
            </select>
          </div>
        </div>
        <div className="related-items-list">
          {selectedSessions.length > 0 ? (
            notes
              .filter(note => selectedSessions.includes(note.id))
              .map(note => (
                <span key={note.id} className="related-item-pill editable">
                  {/* Use a span instead of a Link since we are in a form */}
                  <span>{note.title}</span>
                  <button type="button" className="pill-close" onClick={() => handleSessionToggle(note.id)}>&times;</button>
                </span>
              ))
          ) : (
            <p className="no-items-text">No sessions linked yet.</p>
          )}
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">Save Character</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// --- Reusable Column Filter Component ---
function ColumnFilter({ columnKey, options, onChange, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const filterRef = React.useRef(null);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(columnKey, option);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="filter-wrapper" ref={filterRef}>
      <span
        className={`filter-icon ${value ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        &#9662; {/* Down arrow */}
      </span>
      {isOpen && (
        <div className="filter-dropdown">
          <input
            type="text"
            className="filter-search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
          <ul className="filter-list">
            <li onClick={() => handleSelect('')}>-- All --</li>
            {filteredOptions.map(opt => (
              <li
                key={opt}
                onClick={() => handleSelect(opt)}
                className={opt === value ? 'selected' : ''}
              >
                {opt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
