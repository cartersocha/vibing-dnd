'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export default function CharactersList({ characters = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    race: 'all',
    class: 'all',
    playerType: 'all',
    status: 'all'
  });

  const uniqueValues = useMemo(() => {
    return {
      race: [...new Set(characters.map((char) => char.race).filter(Boolean))].sort(),
      class: [...new Set(characters.map((char) => char.class).filter(Boolean))].sort(),
      playerType: [...new Set(characters.map((char) => char.playerType).filter(Boolean))].sort(),
      status: [...new Set(characters.map((char) => char.status).filter(Boolean))].sort()
    };
  }, [characters]);

  const filteredCharacters = useMemo(() => {
    return characters
      .filter((char) => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        return (
          char.name?.toLowerCase().includes(term) ||
          char.class?.toLowerCase().includes(term) ||
          char.race?.toLowerCase().includes(term)
        );
      })
      .filter((char) => (filters.race === 'all' ? true : char.race === filters.race))
      .filter((char) => (filters.class === 'all' ? true : char.class === filters.class))
      .filter((char) => (filters.playerType === 'all' ? true : char.playerType === filters.playerType))
      .filter((char) => (filters.status === 'all' ? true : char.status === filters.status));
  }, [characters, filters, searchTerm]);

  return (
    <section>
      <div className="page-header">
        <h2>Characters</h2>
        <div className="header-actions-group">
          <Link href="/characters/new" className="btn btn-primary">
            + Create Character
          </Link>
        </div>
      </div>
      <div className="card">
        <div className="filters-header">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="character-search">Search</label>
              <input
                id="character-search"
                type="text"
                className="form-input"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, class, race"
              />
            </div>
            {['race', 'class', 'playerType', 'status'].map((key) => (
              <div className="form-field" key={key}>
                <label htmlFor={`filter-${key}`}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <select
                  id={`filter-${key}`}
                  className="form-select"
                  value={filters[key]}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      [key]: event.target.value
                    }))
                  }
                >
                  <option value="all">All</option>
                  {uniqueValues[key].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        {filteredCharacters.length === 0 ? (
          <p className="no-items-text">No characters match the current filters.</p>
        ) : (
          <div className="character-table-wrapper">
            <table className="character-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Race</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCharacters.map((char) => (
                  <tr key={char.id}>
                    <td>
                      <Link href={`/characters/${char.id}`}>{char.name}</Link>
                    </td>
                    <td>{char.race}</td>
                    <td>{char.class}</td>
                    <td>{char.status || 'Unknown'}</td>
                    <td>{char.location || 'Unknown'}</td>
                    <td>
                      {char.sessions?.length ? (
                        <div className="related-items-list inline">
                          {char.sessions.map((session) => (
                            <span key={session.id} className="related-item-pill">
                              Session {session.sessionNumber}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="no-items-text">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
