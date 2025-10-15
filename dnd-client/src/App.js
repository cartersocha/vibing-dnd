import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, NavLink, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const API_URL = '/api/notes';
const CHAR_API_URL = '/api/characters';

// This is not secure for a real production app, but it's a simple gate for a portfolio project.
const ACCESS_PASSWORD = 'rat palace';

function App() {
  const [notes, setNotes] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    // Check session storage to see if user is already authenticated
    sessionStorage.getItem('dnd-app-authenticated') === 'true'
  );
  
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
    if (!isAuthenticated) return; // Don't fetch data if not logged in
    fetchNotes();
    fetchCharacters();
    // The empty dependency array ensures this runs only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Re-run if authentication status changes

  const handleLogin = (password) => {
    if (password === ACCESS_PASSWORD) {
      sessionStorage.setItem('dnd-app-authenticated', 'true');
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleSaveNote = async (noteData) => {
    try {
      if (noteData.id) {
        // --- UPDATE ---
        const formData = new FormData();
        for (const key in noteData) {
          if (key === 'characters' || key === 'characterIds') continue;
          if (key === 'image' && !noteData[key]) continue;
          if (noteData[key] !== undefined) {
            formData.append(key, noteData[key]);
          }
        }

        const response = await axios.put(`${API_URL}/${noteData.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

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
        const formData = new FormData();
        for (const key in noteData) {
          if (key === 'characterIds' || noteData[key] === null || noteData[key] === undefined) continue;
          formData.append(key, noteData[key]);
        }

        const response = await axios.post(API_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

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

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Main App component now handles routing
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <h1><Link to="/" className="header-link">Tyranny of Dragons</Link></h1>
        </div>
        <nav className="main-nav">
          <NavLink to="/sessions">Sessions</NavLink>
          <NavLink to="/characters">Characters</NavLink>
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
            element={<div className="container"><CharactersPage characters={characters} notes={numberedNotes} /></div>} />
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
        </Routes>
      </div>
    </div>
  );
}

// --- Page Components ---

function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <form onSubmit={handleSubmit}>
          <h2>Enter Access Code</h2>
          <div className="form-field">
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
            />
          </div>
          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <button type="submit" className="btn btn-primary">
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function CharactersPage({ characters, notes }) {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const filterOptions = [
    { key: 'race', label: 'Race', type: 'select' },
    { key: 'class', label: 'Class', type: 'select' },
    { key: 'playerType', label: 'Type', type: 'select' },
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'location', label: 'Location', type: 'select' },
    { key: 'sessions', label: 'Related Sessions', type: 'select' }
  ];

  const addFilter = (filterKey) => {
    if (!activeFilters.find(f => f.key === filterKey)) {
      setActiveFilters(prev => [...prev, { key: filterKey, values: [] }]);
    }
  };

  const updateFilter = (filterKey, values) => {
    setActiveFilters(prev => 
      prev.map(f => f.key === filterKey ? { ...f, values } : f)
    );
  };

  const removeFilter = (filterKey) => {
    setActiveFilters(prev => prev.filter(f => f.key !== filterKey));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  const getUniqueValues = (key) => {
    if (key === 'sessions') {
      return [...new Set(notes.map(n => n.title))].filter(Boolean).sort();
    }
    return [...new Set(characters.map(c => c[key]))].filter(Boolean).sort();
  };

  const filteredCharacters = React.useMemo(() => {
    let filtered = [...characters];

    // Apply filters
    activeFilters.forEach(filter => {
      if (filter.values && filter.values.length > 0) {
        if (filter.key === 'sessions') {
          // Filter by related sessions - check if character has any of the selected sessions
          filtered = filtered.filter(char => {
            if (!char.sessions || char.sessions.length === 0) return false;
            return char.sessions.some(session => filter.values.includes(session.title));
          });
        } else {
          // Filter by character properties
          filtered = filtered.filter(char => {
            const charValue = String(char[filter.key] || '');
            return filter.values.includes(charValue);
          });
        }
      }
    });

    return filtered;
  }, [characters, activeFilters]);

  return (
    <section>
      <div className="page-header">
        <h2>Characters</h2>
        <div className="header-actions-group">
          <button className="btn btn-secondary" onClick={() => setFiltersVisible(!filtersVisible)}>
            {filtersVisible ? 'Hide Filters' : 'Show Filters'}
          </button>
          <Link to="/characters/new" className="btn btn-primary">+ Create Character</Link>
        </div>
      </div>
      
      {/* Dynamic Filter Controls */}
      {filtersVisible && (
        <div className="card">
          <div className="filters-header">
            <h3>Filters</h3>
            <div className="filter-actions">
              <select 
                value="" 
                onChange={(e) => e.target.value && addFilter(e.target.value)}
                className="filter-add-select"
              >
                <option value="">+ Add Filter</option>
                {filterOptions
                  .filter(option => !activeFilters.find(f => f.key === option.key))
                  .map(option => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))
                }
              </select>
              {activeFilters.length > 0 && (
                <button className="btn btn-secondary" onClick={clearAllFilters}>Clear All</button>
              )}
            </div>
          </div>
          
          {activeFilters.length > 0 && (
            <div className="active-filters">
              {activeFilters.map(filter => {
                const option = filterOptions.find(opt => opt.key === filter.key);
                const availableValues = getUniqueValues(filter.key);
                
                return (
                  <div key={filter.key} className="filter-item">
                    <label>{option?.label}</label>
                    <div className="filter-controls">
                      <div className="multi-select-container">
                        <div className="selected-values">
                          {filter.values.length === 0 ? (
                            <span className="placeholder">Select {option?.label.toLowerCase()}</span>
                          ) : (
                            filter.values.map(value => (
                              <span key={value} className="selected-value">
                                {value}
                                <button 
                                  className="remove-value"
                                  onClick={() => {
                                    const newValues = filter.values.filter(v => v !== value);
                                    updateFilter(filter.key, newValues);
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                        <div className="multi-select-options">
                          {availableValues
                            .filter(value => !filter.values.includes(value))
                            .map(value => (
                              <button
                                key={value}
                                className="option-button"
                                onClick={() => {
                                  const newValues = [...filter.values, value];
                                  updateFilter(filter.key, newValues);
                                }}
                              >
                                + {value}
                              </button>
                            ))
                          }
                        </div>
                      </div>
                      <button 
                        className="filter-remove" 
                        onClick={() => removeFilter(filter.key)}
                        title="Remove filter"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Characters Table */}
      <div className="card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Race</th>
              <th>Class</th>
              <th>Type</th>
              <th>Status</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {filteredCharacters.length > 0 ? (
              filteredCharacters.map(char => (
                <tr key={char.id} onClick={() => navigate(`/characters/${char.id}`)} className="clickable-row">
                  <td><strong>{char.name}</strong></td>
                  <td>{char.race}</td>
                  <td>{char.class}</td>
                  <td>{char.playerType}</td>
                  <td>{char.status}</td>
                  <td>{char.location}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  {activeFilters.length > 0 ? 'No characters match the current filters.' : 'No characters found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HomePage({ recentNotes }) {
  return (
    <>
      <section>
        <div className="page-header">
          <h2>Recent Dispatches</h2>
          <Link to="/sessions/new" className="btn btn-primary">+ Add Session</Link>
        </div>
        {recentNotes.length ? (
          recentNotes.map(note => (
            <Link to={`/notes/${note.id}`} key={note.id} className="note-link">
              <div className="card">
                <div className="card-header">
                  <h3>Session {note.sessionNumber}: {note.title}</h3>
                  {note.date && <span className="session-date">{new Date(note.date).toLocaleDateString()}</span>}
                </div>
                <p>{note.content.substring(0, 100)}...</p>
                {note.characters && note.characters.length > 0 && (
                  <div className="session-characters">
                    <div className="related-items-list">
                      {note.characters.map(char => (
                        <span key={char.id} className="related-item-pill">
                          <Link to={`/characters/${char.id}`} onClick={(e) => e.stopPropagation()}>{char.name}</Link>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
          <button onClick={toggleSortOrder} className="btn btn-secondary">
            Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
          <Link to="/sessions/new" className="btn btn-primary">+ Add Session</Link>
        </div>
      </div>
      <div className="note-list-full">
        {sortedNotes.map(note => (
          <Link to={`/notes/${note.id}`} key={note.id} className="note-link"><div className="card">
            <div className="page-header">
              <h3>Session {note.sessionNumber}: {note.title}</h3>
              {note.date && <span className="session-date">{new Date(note.date).toLocaleDateString()}</span>}
            </div>
            <div className="markdown-content">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{`${note.content.substring(0, 200)}...`}</ReactMarkdown>
            </div>
            {note.characters && note.characters.length > 0 && (
              <div className="session-characters">
                <div className="related-items-list">
                  {note.characters.map(char => (
                    <span key={char.id} className="related-item-pill">
                      <Link to={`/characters/${char.id}`} onClick={(e) => e.stopPropagation()}>{char.name}</Link>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div></Link>
        ))}
      </div>
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
      // Also refresh the character data directly
      const res = await axios.get(`${CHAR_API_URL}/${charId}`);
      setCharacter(res.data);
    } catch (err) {
      console.error("Error adding session to character:", err);
      alert(err.response?.data?.message || "Could not add session.");
    }
  };

  const removeSessionFromCharacter = async (sessionId) => {
    try {
      await axios.delete(`${API_URL}/${sessionId}/characters/${character.id}`);
      onDataChange(); // Tell the App to refetch all data
      // Also refresh the character data directly
      const res = await axios.get(`${CHAR_API_URL}/${charId}`);
      setCharacter(res.data);
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
    <div>
      {isEditing ? (
        <CharacterForm
          character={character}
          onSave={handleSaveWrapper}
          onCancel={() => setIsEditing(false)}
          notes={notes}
          characters={[]} // Pass empty array as it's not needed for edit form
        />
      ) : (
        <div className="character-detail-layout">
          <div className="character-detail-main">
            <div className="page-header">
              <h2> {character.name}</h2>
              <div className="header-actions-group">
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
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
              <h3>Backstory & Notes</h3>
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
                      onChange={(e) => addSessionToCharacter(e.target.value)}
                      value=""
                      className="btn btn-primary"
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

function AddCharacterPage({ onSaveCharacter, notes, characters }) {
  const navigate = useNavigate();

  const handleSave = async (charData) => {
    const newChar = await onSaveCharacter(charData);
    if (newChar) {
      navigate(`/characters/${newChar.id}`); // Navigate to the new character's detail page
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
        const fetchedNote = res.data;
        
        // Calculate session number based on chronological order (ascending by date)
        const sortedByDate = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date));
        const noteIndex = sortedByDate.findIndex(n => n.id == noteId); // Use == for type coercion
        const sessionNumber = noteIndex >= 0 ? noteIndex + 1 : 1;
        
        setNote({ ...fetchedNote, sessionNumber });
      } catch (err) {
        console.error("Error fetching note details:", err);
        setNote(null);
      }
    };
    fetchNote();
  }, [noteId, isEditing, notes]);

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
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
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
                  onChange={(e) => addCharacterToSession(e.target.value)}
                  value=""
                  className="btn btn-secondary"
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
          ) : <p className="no-items-text">No characters have been added to this session yet.</p>}
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(note.imageUrl || null);
  const [selectedCharacters, setSelectedCharacters] = useState(note.characters?.map(c => c.id) || []);

  useEffect(() => {
    setTitle(note.title || '');
    setDate(note.date || new Date().toISOString().split('T')[0]);
    setContent(note.content || '');
    setImagePreview(note.imageUrl || null);
    setSelectedCharacters(note.characters?.map(c => c.id) || []);
  }, [note]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCharacterToggle = (charId) => {
    setSelectedCharacters(prev =>
      prev.includes(charId) ? prev.filter(id => id !== charId) : [...prev, charId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...note, title, date, content, characterIds: selectedCharacters, image: imageFile });
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
            className="form-input" value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="note-date">Session Date</label>
          <input
            id="note-date"
            type="date"
            className="form-input" value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="note-content">Session Details</label>
        <textarea
          id="note-content"
          className="form-textarea" value={content}
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
              className="btn btn-secondary"
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
        <button type="submit" className="btn btn-primary">Save Session</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
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
  const [imagePreview, setImagePreview] = useState(character.imageUrl || null);

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
            type="text" className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="char-status">Status</label>
          <select id="char-status" className="form-select" value={status} onChange={e => setStatus(e.target.value)} required>
            <option value="Alive">Alive</option>
            <option value="Dead">Dead</option>
            <option value="Missing">Missing</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="char-location">Last Known Location</label>
          <input
            id="char-location"
            type="text" className="form-input"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="char-race">Race</label>
          <select id="char-race" className="form-select" value={race} onChange={e => setRace(e.target.value)} required>
            <option value="" disabled>Select a Race</option>
            {races.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="char-class">Class</label>
          <select id="char-class" className="form-select" value={charClass} onChange={e => setCharClass(e.target.value)} required>
            <option value="" disabled>Select a Class</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="char-type">Player Type</label>
          <select id="char-type" className="form-select" value={playerType} onChange={e => setPlayerType(e.target.value)} required>
            <option value="Player">Player</option>
            <option value="Non-Player">Non-Player</option>
          </select>
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="char-backstory">Backstory & Notes</label>
        <textarea
          id="char-backstory" className="form-textarea"
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
              className="btn btn-secondary"
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
        <button type="submit" className="btn btn-primary">Save Character</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}


export default App;
