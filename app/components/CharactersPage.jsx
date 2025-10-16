'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CharactersPage({ characters, notes }) {
  const router = useRouter();
  const [activeFilters, setActiveFilters] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const filterOptions = [
    { key: 'race', label: 'Race' },
    { key: 'class', label: 'Class' },
    { key: 'playerType', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'location', label: 'Location' },
    { key: 'sessions', label: 'Related Sessions' },
  ];

  const addFilter = (filterKey) => {
    if (!activeFilters.find((filter) => filter.key === filterKey)) {
      setActiveFilters((prev) => [...prev, { key: filterKey, values: [] }]);
    }
  };

  const updateFilter = (filterKey, values) => {
    setActiveFilters((prev) => prev.map((filter) => (filter.key === filterKey ? { ...filter, values } : filter)));
  };

  const removeFilter = (filterKey) => {
    setActiveFilters((prev) => prev.filter((filter) => filter.key !== filterKey));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  const getUniqueValues = (key) => {
    if (key === 'sessions') {
      return [...new Set(notes.map((note) => note.title))].filter(Boolean).sort();
    }
    return [...new Set(characters.map((character) => character[key]))].filter(Boolean).sort();
  };

  const filteredCharacters = useMemo(() => {
    let filtered = [...characters];
    activeFilters.forEach((filter) => {
      if (filter.values && filter.values.length > 0) {
        if (filter.key === 'sessions') {
          filtered = filtered.filter((character) => {
            if (!character.sessions || character.sessions.length === 0) return false;
            return character.sessions.some((session) => filter.values.includes(session.title));
          });
        } else {
          filtered = filtered.filter((character) => {
            const value = String(character[filter.key] || '');
            return filter.values.includes(value);
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
          <button className="btn btn-secondary" onClick={() => setFiltersVisible((prev) => !prev)}>
            {filtersVisible ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/characters/new')}>
            + Create Character
          </button>
        </div>
      </div>

      {filtersVisible && (
        <div className="card">
          <div className="filters-header">
            <h3>Filters</h3>
            <div className="filter-actions">
              <select
                value=""
                onChange={(event) => event.target.value && addFilter(event.target.value)}
                className="filter-add-select"
              >
                <option value="">+ Add Filter</option>
                {filterOptions
                  .filter((option) => !activeFilters.find((filter) => filter.key === option.key))
                  .map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
              </select>
              {activeFilters.length > 0 && (
                <button className="btn btn-secondary" onClick={clearAllFilters}>Clear All</button>
              )}
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="active-filters">
              {activeFilters.map((filter) => {
                const option = filterOptions.find((opt) => opt.key === filter.key);
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
                            filter.values.map((value) => (
                              <span key={value} className="selected-value">
                                {value}
                                <button
                                  className="remove-value"
                                  type="button"
                                  onClick={() => {
                                    const nextValues = filter.values.filter((item) => item !== value);
                                    updateFilter(filter.key, nextValues);
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
                            .filter((value) => !filter.values.includes(value))
                            .map((value) => (
                              <button
                                key={value}
                                type="button"
                                className="option-button"
                                onClick={() => updateFilter(filter.key, [...filter.values, value])}
                              >
                                + {value}
                              </button>
                            ))}
                        </div>
                      </div>
                      <button
                        className="filter-remove"
                        type="button"
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
              filteredCharacters.map((character) => (
                <tr
                  key={character.id}
                  onClick={() => router.push(`/characters/${character.id}`)}
                  className="clickable-row"
                >
                  <td><strong>{character.name}</strong></td>
                  <td>{character.race}</td>
                  <td>{character.class}</td>
                  <td>{character.playerType}</td>
                  <td>{character.status}</td>
                  <td>{character.location}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-results">
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
